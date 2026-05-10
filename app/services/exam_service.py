from datetime import datetime, timezone

from app.ai.review_service import AIReviewService
from app.models.exam_attempt import ExamAttempt
from app.models.user import User
from app.repositories.exam_repository import ExamRepository
from app.schemas.exam import (
    AttemptSubmitResponse,
    ExamAttemptResponse,
    ExamGenerateRequest,
    ExamGenerateResponse,
    ExamSubmitRequest,
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizQuestion,
    QuizSubmitRequest,
)
from app.services.audit_service import AuditService
from app.services.security_service import SecurityService
from app.services.streak_service import StreakService
from app.ai.generation_service import AIGenerationService
from app.repositories.submission_repository import SubmissionRepository

EXAM_MAX_POINTS = 165


class ExamService:
    def __init__(self, session) -> None:
        self.session = session
        self.repo = ExamRepository(session)
        self.ai_review_service = AIReviewService()
        self.security_service = SecurityService(session)
        self.audit_service = AuditService(session)
        self.streak_service = StreakService(session)
        self.ai_generator = AIGenerationService()
        self.submission_repo = SubmissionRepository(session)

    async def _get_recent_context(self, user: User) -> list[dict]:
        submissions = await self.submission_repo.get_recent_by_user(user.id, limit=8)

        return [
            {
                "task_title": s.task.title if s.task else None,
                "task_type": s.task.task_type if s.task else None,
                "skill_tag": s.task.skill_tag if s.task else None,
                "score": s.score,
                "status": s.status,
                "feedback": s.feedback,
                "why_not_verified": s.why_not_verified,
                "suspicion_score": s.suspicion_score,
            }
            for s in submissions
        ]

    async def generate_quiz(
        self,
        user: User,
        data: QuizGenerateRequest,
    ) -> QuizGenerateResponse:
        self.security_service.check_ai_rate_limit(user)

        question_count = normalize_question_count(data.question_count)
        max_points = get_quiz_max_points(question_count)
        skill = data.skill_name.strip()
        language = data.language or "selected language"

        recent_context = await self._get_recent_context(user)

        ai_result = await self.ai_generator.generate_quiz(
            user=user,
            topic=(
                f"{skill} in {language}. "
                f"Generate questions based on the user's recent weak areas and submissions: {recent_context}"
            ),
            question_count=question_count,
            reward_points=max_points,
        )

        questions = [
            QuizQuestion(
                question=q.question,
                options=q.options,
                correct_answer=q.correct_answer,
            )
            for q in ai_result.questions
        ]

        return QuizGenerateResponse(
            title=ai_result.title or f"{skill.title()} Quiz",
            skill_name=skill,
            question_count=question_count,
            max_points=max_points,
            questions=questions[:question_count],
        )

    async def generate_exam(
        self,
        user: User,
        data: ExamGenerateRequest,
    ) -> ExamGenerateResponse:
        self.security_service.check_ai_rate_limit(user)

        skill = data.skill_name.strip()
        language = data.language or "selected language"
        recent_context = await self._get_recent_context(user)

        weak_skills = []  # позже можно подключить UserSkillRepository

        ai_result = await self.ai_generator.generate_exam_checkpoint(
            user=user,
            skill_name=skill,
            language=data.language,
            difficulty=data.difficulty,
            recent_submissions=recent_context,
            weak_skills=weak_skills,
        )

        return ExamGenerateResponse(
            title=ai_result.get("title") or f"{skill.title()} Checkpoint Exam",
            skill_name=skill,
            max_points=EXAM_MAX_POINTS,
            time_limit_minutes=45,
            task_title=ai_result.get("task_title") or f"Prove {skill.title()} under pressure",
            task_description=ai_result.get("task_description")
            or f"Build or explain a realistic solution using {skill}. Include proof, reasoning, edge cases, and improvement notes.",
            expected_proof=ai_result.get("expected_proof")
            or [
                "Working code or concrete technical solution",
                "Explanation of core logic",
                "At least one edge case",
                "Why your approach works",
                "What you would improve next",
            ],
        )

    async def submit_quiz(
        self,
        user: User,
        data: QuizSubmitRequest,
    ) -> AttemptSubmitResponse:
        question_count = normalize_question_count(data.question_count)
        max_points = get_quiz_max_points(question_count)
        correct_count = max(0, min(data.correct_count, question_count))

        score = int(round((correct_count / question_count) * 100))
        earned_points = int(round((score / 100) * max_points))
        status = get_status(score, required_score=70)

        attempts = await self.repo.get_attempts(
            user_id=user.id,
            attempt_type="quiz",
            skill_name=data.skill_name,
        )
        attempts_allowed = get_quiz_attempts_allowed(score)

        if len(attempts) >= attempts_allowed:
            raise ValueError("No quiz attempts left for this score tier")

        attempt = ExamAttempt(
            user_id=user.id,
            goal_id=data.goal_id,
            attempt_type="quiz",
            skill_name=data.skill_name,
            content_text=f"Quiz result: {correct_count}/{question_count}",
            content_code=None,
            score=score,
            earned_points=earned_points,
            max_points=max_points,
            status=status,
            feedback=f"Quiz score: {correct_count}/{question_count}.",
            suspicion_score=0,
            affects_streak=True,
            reviewed_at=datetime.now(timezone.utc),
        )

        attempt = await self.repo.create(attempt)
        await self.streak_service.apply_points(user.id, earned_points)

        best_attempt = await self.repo.get_best_attempt(
            user_id=user.id,
            attempt_type="quiz",
            skill_name=data.skill_name,
        )

        await self.audit_service.log(
            action="quiz.submit",
            status="success",
            user_id=user.id,
            target_type="skill",
            target_id=None,
            details=f"skill={data.skill_name}, score={score}, earned_points={earned_points}",
        )

        attempts_used = len(attempts) + 1

        return AttemptSubmitResponse(
            attempt=ExamAttemptResponse.model_validate(attempt),
            best_attempt=ExamAttemptResponse.model_validate(best_attempt)
            if best_attempt
            else None,
            attempts_used=attempts_used,
            attempts_allowed=attempts_allowed,
            can_retry=attempts_used < attempts_allowed,
        )

    async def submit_exam(
        self,
        user: User,
        data: ExamSubmitRequest,
    ) -> AttemptSubmitResponse:
        self.security_service.check_ai_rate_limit(user)

        if not data.content_text and not data.content_code:
            raise ValueError("Exam submission must include explanation or code")

        attempts = await self.repo.get_attempts(
            user_id=user.id,
            attempt_type="exam",
            skill_name=data.skill_name,
        )

        ai_result = await self.ai_review_service.review_submission(
            user=user,
            task_title=f"{data.skill_name} checkpoint exam",
            task_description=(
                f"Checkpoint exam for skill: {data.skill_name}. "
                "This should be harder than a normal build task. Review strictly but fairly. "
                "User must prove understanding with code, reasoning, edge cases, and explanation."
            ),
            task_type="exam",
            verification_type="mixed",
            required_score=75,
            submission_text=data.content_text,
            submission_code=data.content_code,
        )

        score = int(ai_result.get("score", 50))
        score = max(0, min(score, 100))

        attempts_allowed = get_exam_attempts_allowed(score)

        if len(attempts) >= attempts_allowed:
            raise ValueError("No exam attempts left for this score tier")

        earned_points = int(round((score / 100) * EXAM_MAX_POINTS))
        status = get_status(score, required_score=75)

        attempt = ExamAttempt(
            user_id=user.id,
            goal_id=data.goal_id,
            attempt_type="exam",
            skill_name=data.skill_name,
            content_text=data.content_text,
            content_code=data.content_code,
            score=score,
            earned_points=earned_points,
            max_points=EXAM_MAX_POINTS,
            status=status,
            feedback=ai_result.get("feedback"),
            suspicion_score=int(ai_result.get("suspicion", 0)),
            followup_question=ai_result.get("followup_question"),
            affects_streak=True,
            reviewed_at=datetime.now(timezone.utc),
        )

        attempt = await self.repo.create(attempt)
        await self.streak_service.apply_points(user.id, earned_points)

        best_attempt = await self.repo.get_best_attempt(
            user_id=user.id,
            attempt_type="exam",
            skill_name=data.skill_name,
        )

        await self.audit_service.log(
            action="exam.submit",
            status="success",
            user_id=user.id,
            target_type="skill",
            target_id=None,
            details=f"skill={data.skill_name}, score={score}, earned_points={earned_points}",
        )

        attempts_used = len(attempts) + 1

        return AttemptSubmitResponse(
            attempt=ExamAttemptResponse.model_validate(attempt),
            best_attempt=ExamAttemptResponse.model_validate(best_attempt)
            if best_attempt
            else None,
            attempts_used=attempts_used,
            attempts_allowed=attempts_allowed,
            can_retry=attempts_used < attempts_allowed,
        )

    async def request_manual_review(self, user: User, attempt_id: int) -> ExamAttempt:
        attempt = await self.repo.get_by_id(attempt_id)

        if not attempt or attempt.user_id != user.id:
            raise ValueError("Exam attempt not found")

        if attempt.attempt_type != "exam":
            raise ValueError("Manual review is available only for exams")

        attempt.manual_review_requested = True
        return await self.repo.update(attempt)


def normalize_question_count(value: int) -> int:
    if value <= 5:
        return 5
    if value <= 10:
        return 10
    return 15


def get_quiz_max_points(question_count: int) -> int:
    if question_count == 5:
        return 35
    if question_count == 10:
        return 70
    return 100


def get_status(score: int, *, required_score: int) -> str:
    if score == 0:
        return "rejected"
    if score >= required_score:
        return "verified"
    return "partial"


def get_quiz_attempts_allowed(score: int) -> int:
    if score < 50:
        return 2
    if score < 90:
        return 1
    return 1


def get_exam_attempts_allowed(score: int) -> int:
    if score < 50:
        return 3
    if score < 70:
        return 2
    if score < 90:
        return 1
    return 1