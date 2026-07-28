import json
import re
from typing import Any

from openai import AsyncOpenAI

from app.ai.prompts import CODEFORGE_AI_SYSTEM_PROMPT
from app.ai.review_service import MODEL_BY_TIER
from app.core.config import get_settings
from app.domain.enums import TaskType, VerificationType
from app.schemas.ai import (
    AIDailyPlanResponse,
    AIQuizGenerateResponse,
    AITaskGenerateResponse,
    AIPressureMessageResponse,
)

settings = get_settings()


def extract_json_object(content: str) -> dict:
    if not content:
        raise ValueError("Empty AI response")

    cleaned = content.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```json\s*", "", cleaned)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found")

    return json.loads(cleaned[start : end + 1])


def compact_json(value: Any) -> str:
    return json.dumps(value or [], ensure_ascii=False, separators=(",", ":"))


def normalize_skill_tag(value: str | None) -> str:
    raw = (value or "general").strip().lower()
    raw = re.sub(r"[^a-z0-9_]+", "_", raw)
    raw = re.sub(r"_+", "_", raw).strip("_")
    return raw or "general"


class AIGenerationService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    def get_model_for_user(self, user) -> str:
        return MODEL_BY_TIER.get(user.subscription_tier, "gpt-4o-mini")

    async def generate_tasks(
        self,
        user,
        *,
        goal_title: str,
        milestone_title: str,
        count: int,
        focus_topic: str | None,
        weak_skills: list[str] | None = None,
    ) -> AITaskGenerateResponse:
        model = self.get_model_for_user(user)

        weak_skills_text = "None"
        if user.subscription_tier in ["plus", "ultra"] and weak_skills:
            weak_skills_text = "\n".join(f"- {skill}" for skill in weak_skills)

        prompt = f"""
Generate {count} CodeForge tasks.

CodeForge task quality standard:
A task is valid only if a user can submit concrete proof and a reviewer can verify whether real work happened.

Context:
Goal: {goal_title}
Milestone: {milestone_title}
Focus topic: {focus_topic or milestone_title}
Required task count: {count}

User weak areas:
{weak_skills_text}

Progression rules:
- Tasks must form a progression, not random isolated exercises.
- Start with understanding, move to implementation, then application.
- If count is 1: generate the single most useful practical task.
- If count is 2: generate one coding task and one build/application task.
- If count is 3+: include learning, coding, and build tasks.
- Difficulty must scale across the list:
  - learning: difficulty 1-2
  - coding: difficulty 2-3
  - build: difficulty 3-4
- Do not make all tasks the same difficulty.

Specificity rules:
- No generic titles.
- Forbidden title patterns:
  - "Learn basics"
  - "Practice loops"
  - "Do exercise"
  - "Build simple app"
  - "Study topic"
  - "Implement feature"
- Every title must mention a concrete output.
- Every description must include:
  1. what to build / explain
  2. what proof to submit
  3. what edge case or design choice to explain
- Every task must be different in output, proof, and skill focus.
- Do not create near-duplicates.

Proof rules:
- Learning tasks require explanation proof + small example.
- Coding tasks require working code + explanation + edge case.
- Build tasks require feature-level proof + architecture reasoning + test/edge case.
- The user must not be able to pass by saying "done".
- For coding/build, require code proof and a short explanation of why it works.

Anti-copy rules:
- Include at least one requirement that forces understanding:
  - explain tradeoff
  - list edge cases
  - justify architecture
  - explain bug prevention
  - modify the example with a small twist
- Avoid tasks that can be solved by copying a common tutorial unchanged.

Reward rules:
- learning: 35
- coding: 65
- build: 100
- required_score: usually 70
- is_required: true
- unlock_condition_text: null unless task logically depends on previous proof

Return ONLY valid JSON.
No markdown.
No code fences.

JSON shape:
{{
  "tasks": [
    {{
      "title": "Specific output-focused title",
      "description": "Specific task. Include proof requirements, edge cases, and explanation requirements.",
      "task_type": "learning",
      "verification_type": "mixed",
      "skill_tag": "loops",
      "difficulty": 1,
      "estimated_minutes": 30,
      "reward_points": 35,
      "required_score": 70,
      "is_required": true,
      "unlock_condition_text": null
    }}
  ]
}}
"""

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": CODEFORGE_AI_SYSTEM_PROMPT + "\nReturn only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
        )

        content = response.choices[0].message.content

        try:
            data = extract_json_object(content)
            return AITaskGenerateResponse(**data)
        except Exception:
            return AITaskGenerateResponse(
                tasks=self._fallback_tasks(
                    count=count,
                    milestone_title=milestone_title,
                    focus_topic=focus_topic,
                )
            )

    def _fallback_tasks(
        self,
        *,
        count: int,
        milestone_title: str,
        focus_topic: str | None,
    ) -> list[dict]:
        topic = focus_topic or milestone_title
        skill_tag = normalize_skill_tag(topic)

        templates = [
            {
                "title": f"Map {topic} into a real backend use case",
                "description": (
                    f"Explain {topic} through one realistic backend scenario. "
                    "Submit a short explanation, one small example, and describe one mistake that would break the implementation."
                ),
                "task_type": TaskType.LEARNING,
                "verification_type": VerificationType.TEXT,
                "skill_tag": skill_tag,
                "difficulty": 1,
                "estimated_minutes": 25,
                "reward_points": 35,
            },
            {
                "title": f"Implement a focused {topic} code example with edge handling",
                "description": (
                    f"Write a working code example that uses {topic}. "
                    "Submit the code, explain the core logic, and include at least one edge case or failure scenario."
                ),
                "task_type": TaskType.CODING,
                "verification_type": VerificationType.MIXED,
                "skill_tag": skill_tag,
                "difficulty": 2,
                "estimated_minutes": 40,
                "reward_points": 65,
            },
            {
                "title": f"Build a mini feature that depends on {topic}",
                "description": (
                    f"Apply {topic} inside a small practical feature. "
                    "Submit code, explain the architecture, list one tradeoff, and describe how you would test it."
                ),
                "task_type": TaskType.BUILD,
                "verification_type": VerificationType.MIXED,
                "skill_tag": skill_tag,
                "difficulty": 3,
                "estimated_minutes": 70,
                "reward_points": 100,
            },
            {
                "title": f"Debug a broken scenario around {topic}",
                "description": (
                    f"Create or describe a broken example involving {topic}, then fix it. "
                    "Submit the broken version, fixed version, and explain what caused the bug."
                ),
                "task_type": TaskType.CODING,
                "verification_type": VerificationType.MIXED,
                "skill_tag": skill_tag,
                "difficulty": 3,
                "estimated_minutes": 45,
                "reward_points": 65,
            },
        ]

        tasks = []
        for idx in range(count):
            base = templates[idx % len(templates)]
            tasks.append(
                {
                    **base,
                    "title": base["title"] if idx < len(templates) else f'{base["title"]} #{idx + 1}',
                    "required_score": 70,
                    "is_required": True,
                    "unlock_condition_text": None,
                }
            )

        return tasks

    async def learn_topic(
        self,
        user,
        *,
        goal_title: str,
        topic: str,
        language: str | None,
        level: str | None,
    ) -> dict:
        model = self.get_model_for_user(user)

        prompt = f"""
Create a practical pre-task learning explanation.

Goal: {goal_title}
Topic: {topic}
Language: {language or "not specified"}
User level: {level or "beginner"}

Rules:
- Explain only what the user needs before execution.
- Avoid academic textbook tone.
- Use practical examples.
- Include common mistakes.
- Include where this appears in real projects.
- Include proof requirements.
- If code is relevant, include a small example.
- Do not mention that you are an AI.
- Return ONLY valid JSON.
- No markdown.
- No code fences.

JSON shape:
{{
  "title": "Topic title",
  "explanation": "Clear practical explanation.",
  "key_points": ["point 1", "point 2", "point 3"],
  "common_mistakes": ["mistake 1", "mistake 2"],
  "mini_example": "Small code or conceptual example.",
  "practice_prompt": "A small practice task the user can do now.",
  "proof_requirements": ["what to submit", "what to explain"]
}}
"""

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": CODEFORGE_AI_SYSTEM_PROMPT + "\nReturn only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
        )

        content = response.choices[0].message.content

        try:
            return extract_json_object(content)
        except Exception:
            return {
                "title": topic,
                "explanation": f"Learn the core idea of {topic}, then apply it in a small practical example.",
                "key_points": [
                    "Understand the main concept.",
                    "Know when to use it.",
                    "Practice with a small example.",
                ],
                "common_mistakes": [
                    "Copying code without understanding it.",
                    "Skipping edge cases.",
                ],
                "mini_example": "Write a small example and explain each important part.",
                "practice_prompt": f"Create a small example using {topic}.",
                "proof_requirements": [
                    "Submit your explanation.",
                    "Submit code if relevant.",
                    "Explain why your solution works.",
                ],
            }

    async def generate_coach_feedback(
        self,
        user,
        *,
        weak_skills: list[str],
        recent_submissions: list[dict],
    ) -> dict:
        model = self.get_model_for_user(user)

        prompt = f"""
Analyze the user's learning progress and give strict but helpful coaching.

User weak skills:
{compact_json(weak_skills)}

Recent submissions:
{compact_json(recent_submissions)}

Important:
- Use task_title and skill_tag to identify patterns.
- If a task was rejected, explain exactly why it failed.
- If explanation is weak, call it out directly.
- Always reference specific tasks from recent submissions if available.
- Do not give generic advice.
- Each reason must be specific and tied to a mistake.
- Be strict, but useful.

Rules:
- Be practical, not motivational fluff.
- Focus on what the user should fix next.
- Never answer with "None identified".
- If there are no stable strengths, use "No stable strengths yet".
- next_actions must contain exactly 3 actions: learn, practice, submit.
- severity must be one of: low, medium, high.
- Return ONLY valid JSON.
- No markdown.
- No code fences.
- Add pressure_message: strict but not insulting.
- execution_risk must reflect how likely the user is to stall or fake progress.
- pressure_message must push the user to submit real proof, not vague answers.

JSON shape:
{{
  "summary": "Short honest summary of user's current progress.",
  "severity": "medium",
  "weak_areas": ["area 1", "area 2"],
  "strengths": ["No stable strengths yet"],
  "diagnosis": "Why the user is struggling right now.",
  "execution_risk": "low | medium | high",
  "pressure_message": "Strict but useful execution pressure message.",
  "next_actions": [
    {{
      "type": "learn",
      "title": "What to learn next",
      "reason": "Why this matters based on a concrete mistake"
    }},
    {{
      "type": "practice",
      "title": "What to practice next",
      "reason": "Why this matters based on a concrete mistake"
    }},
    {{
      "type": "submit",
      "title": "What proof to submit",
      "reason": "Why this matters based on a concrete mistake"
    }}
  ],
  "recommended_focus": "one concrete topic to focus on next",
  "warning": null
}}
"""

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": CODEFORGE_AI_SYSTEM_PROMPT + "\nReturn only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
        )

        content = response.choices[0].message.content

        try:
            return extract_json_object(content)
        except Exception:
            return {
                "summary": "Not enough reliable data yet. Complete more tasks so CodeForge can analyze your progress better.",
                "severity": "medium",
                "weak_areas": weak_skills or [],
                "strengths": ["No stable strengths yet"],
                "diagnosis": "There is not enough verified submission history to build a precise diagnosis.",
                "execution_risk": "medium",
                "pressure_message": "You need more verified proof before the system can diagnose deeper patterns.",
                "next_actions": [
                    {
                        "type": "learn",
                        "title": "Review the current milestone topic",
                        "reason": "You need a stronger base before CodeForge can detect deeper patterns.",
                    },
                    {
                        "type": "practice",
                        "title": "Complete one small practical task",
                        "reason": "A practical task gives more useful data than passive reading.",
                    },
                    {
                        "type": "submit",
                        "title": "Submit code plus explanation",
                        "reason": "CodeForge needs both implementation and reasoning to verify real understanding.",
                    },
                ],
                "recommended_focus": weak_skills[0] if weak_skills else "current milestone",
                "warning": "Coach feedback is limited because there is not enough submission data.",
            }

    async def generate_coach_chat_answer(
        self,
        user,
        *,
        message: str,
        weak_skills: list[str],
        recent_submissions: list[dict],
    ) -> dict:
        model = self.get_model_for_user(user)

        prompt = f"""
User message:
{message}

User weak skills:
{compact_json(weak_skills)}

Recent submissions:
{compact_json(recent_submissions)}

Rules:
- Answer like a strict execution mentor.
- Be practical and specific.
- No motivational fluff.
- Do not mention that you are an AI.
- Push toward proof-based execution.
- If the user asks what to do next, give concrete next steps.
- Do not solve full coding tasks for the user.
- Give structure, hints, checks, and next actions.
- suggested_actions must contain 2-4 short actions.
- Return ONLY valid JSON.
- No markdown.
- No code fences.

JSON shape:
{{
  "answer": "Your direct coaching answer.",
  "suggested_actions": [
    "Open Today",
    "Fix latest weak proof",
    "Submit code plus explanation"
  ]
}}
"""

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": CODEFORGE_AI_SYSTEM_PROMPT + "\nReturn only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        content = response.choices[0].message.content

        try:
            return extract_json_object(content)
        except Exception:
            return {
                "answer": "Start with Today. Pick the next available task, submit working proof, and explain your reasoning clearly. Vague progress does not count.",
                "suggested_actions": [
                    "Open Today",
                    "Complete one task",
                    "Submit proof with explanation",
                ],
            }

    async def generate_quiz(
        self,
        user,
        *,
        topic: str,
        question_count: int,
        reward_points: int = 35,
    ) -> AIQuizGenerateResponse:
        model = self.get_model_for_user(user)

        prompt = f"""
Create a coding quiz that checks real understanding.

Topic: {topic}
Questions count: {question_count}

Rules:
- Generate EXACTLY {question_count} questions.
- Each question must have exactly 4 options.
- correct_answer must exactly match one of the options.
- Questions should test understanding, not trivia.
- Avoid obvious questions.
- Include debugging, prediction, and concept application questions when possible.
- Return ONLY valid JSON.
- No markdown.
- No code fences.

JSON shape:
{{
  "title": "Quiz title",
  "questions": [
    {{
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A"
    }}
  ]
}}
"""

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": CODEFORGE_AI_SYSTEM_PROMPT + "\nReturn only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content

        try:
            data = extract_json_object(content)
            data["question_count"] = len(data.get("questions", []))
            data["potential_reward_points"] = reward_points
            return AIQuizGenerateResponse(**data)
        except Exception:
            return AIQuizGenerateResponse(
                title=f"{topic} quiz",
                question_count=0,
                potential_reward_points=reward_points,
                questions=[],
            )

    async def generate_daily_plan(
        self,
        user,
        *,
        goal_title: str,
        goal_description: str | None,
        language: str | None,
        level: str | None,
        learning_style: str | None,
        accountability_mode: str | None,
        milestone_title: str,
        existing_tasks: list[dict],
        unfinished_tasks: list[dict],
        weak_skills: list[str],
        recent_submissions: list[dict],
        daily_tasks_min: int,
        daily_tasks_max: int,
        max_daily_points: int,
        pressure_level: str,
        ai_strictness: str,
        regenerate: bool = False,
    ) -> AIDailyPlanResponse:
        model = self.get_model_for_user(user)

        existing_tasks_text = compact_json(existing_tasks)
        unfinished_tasks_text = compact_json(unfinished_tasks)
        weak_skills_text = compact_json(weak_skills)
        recent_submissions_text = compact_json(recent_submissions)

        prompt = f"""
You are CodeForge AI Daily Planner.

CodeForge is not a checklist app. It is a proof-based execution system.

Generate ONE daily execution plan.

Mandatory day structure:
1. learn
2. practice
3. build

Context:
Goal title: {goal_title}
Goal description: {goal_description or "None"}
Programming language: {language or "not specified"}
User level: {level or "not specified"}
Learning style: {learning_style or "balanced"}
Accountability mode: {accountability_mode or "normal"}
Current milestone: {milestone_title}

User settings:
Pressure level: {pressure_level}
AI strictness: {ai_strictness}
Regenerate requested: {regenerate}

Limits:
Daily tasks min: {daily_tasks_min}
Daily tasks max: {daily_tasks_max}
Max daily points: {max_daily_points}

Existing available tasks:
{existing_tasks_text}

Unfinished old tasks:
{unfinished_tasks_text}

Weak skills:
{weak_skills_text}

Recent submissions:
{recent_submissions_text}

Planning rules:
- Return EXACTLY 3 items: learn, practice, build.
- Order must be learn → practice → build.
- The plan must feel like one coherent mini-project day, not 3 random tasks.
- learn should prepare the exact concept used in practice.
- practice should implement a focused part.
- build should apply it in a small realistic feature.
- If unfinished tasks exist and are relevant, include at least one. Do not let users escape important unfinished work.
- Use existing tasks only when they are specific, useful, and fit today's structure.
- Generate new tasks when existing tasks are generic, duplicate, too easy, or not aligned.
- Regeneration must produce a materially different plan, not rewording.
- Weakness focus should be 30-60% of the plan, not all of it.
- Avoid repeated skill_tag across all 3 tasks unless the milestone requires it.

Difficulty rules:
- For beginner:
  - learn difficulty 1
  - practice difficulty 1-2
  - build difficulty 2
- For intermediate:
  - learn difficulty 1-2
  - practice difficulty 2-3
  - build difficulty 3
- For advanced:
  - learn difficulty 2
  - practice difficulty 3-4
  - build difficulty 4
- Do not make build easier than practice.

Quality rules:
- No generic titles.
- Every title must describe a concrete output.
- Every task must require proof.
- Every task description must include:
  1. exact output
  2. proof to submit
  3. explanation required
  4. at least one edge case, test, or design choice
- Do not generate tutorial-watching tasks.
- Do not generate tasks that can be completed by saying "I understood".
- Do not give the full solution.

Proof requirements by slot:
- learn: explanation + small example + common mistake
- practice: working code + explanation + edge case
- build: feature proof + architecture reasoning + test or failure case

Reward rules:
- learn: 35
- practice/coding: 65
- build: 100
- Total reward_points should not exceed max_daily_points.
- If max_daily_points is less than 200, reduce build reward first but keep minimum 65.
- required_score should usually be 70.
- is_required must be true.

Source rules:
- If source is "existing", existing_task_id must be a real id from existing_tasks or unfinished_tasks.
- If source is "new", existing_task_id must be null.

Return ONLY valid JSON.
No markdown.
No code fences.

JSON shape:
{{
  "strategy": "Short explanation of why this plan was selected.",
  "pressure_message": "Strict but useful pressure message.",
  "required_points": 100,
  "items": [
    {{
      "slot": "learn",
      "source": "existing",
      "existing_task_id": 123,
      "title": "Specific title",
      "description": "Specific proof-based task description.",
      "task_type": "learning",
      "verification_type": "text",
      "skill_tag": "functions",
      "difficulty": 1,
      "estimated_minutes": 25,
      "reward_points": 35,
      "required_score": 70,
      "is_required": true,
      "reason": "Why this task is in today's plan."
    }},
    {{
      "slot": "practice",
      "source": "new",
      "existing_task_id": null,
      "title": "Specific practice task",
      "description": "Specific proof-based task description.",
      "task_type": "coding",
      "verification_type": "mixed",
      "skill_tag": "functions",
      "difficulty": 2,
      "estimated_minutes": 40,
      "reward_points": 65,
      "required_score": 70,
      "is_required": true,
      "reason": "Why this task is in today's plan."
    }},
    {{
      "slot": "build",
      "source": "new",
      "existing_task_id": null,
      "title": "Specific build task",
      "description": "Specific proof-based task description.",
      "task_type": "build",
      "verification_type": "mixed",
      "skill_tag": "fastapi",
      "difficulty": 3,
      "estimated_minutes": 70,
      "reward_points": 100,
      "required_score": 70,
      "is_required": true,
      "reason": "Why this task is in today's plan."
    }}
  ]
}}
"""

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": CODEFORGE_AI_SYSTEM_PROMPT + "\nReturn only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
        )

        content = response.choices[0].message.content

        try:
            data = extract_json_object(content)
            return AIDailyPlanResponse(**data)
        except Exception:
            return self._fallback_daily_plan(
                milestone_title=milestone_title,
                focus_topic=weak_skills[0] if weak_skills else milestone_title,
                max_daily_points=max_daily_points,
            )

    async def generate_pressure_message(
        self,
        user,
        *,
        pressure_type: str,
        earned_points_today: int,
        required_points: int,
        unfinished_tasks: list[dict],
        recent_submissions: list[dict],
        pressure_level: str,
        ai_strictness: str,
    ) -> AIPressureMessageResponse:
        model = self.get_model_for_user(user)

        prompt = f"""
You are CodeForge pressure system.

Generate ONE short in-app notification.

Context:
Pressure type: {pressure_type}
Earned points today: {earned_points_today}
Required points today: {required_points}
Pressure level: {pressure_level}
AI strictness: {ai_strictness}

Unfinished tasks:
{compact_json(unfinished_tasks)}

Recent submissions:
{compact_json(recent_submissions)}

Rules:
- Be strict, direct, and useful.
- No insults.
- No motivational fluff.
- Push the user toward proof-based execution.
- Message must be short.
- Title max 80 characters.
- Message max 220 characters.
- severity must be low, medium, or high.
- type must be one of: daily_reminder, streak_warning, inactivity_alert.
- Return ONLY valid JSON.
- No markdown.
- No code fences.

JSON shape:
{{
  "type": "streak_warning",
  "title": "Streak at risk",
  "message": "You are below today’s required proof. Open Today, finish one task, and submit real evidence before the day burns.",
  "severity": "high"
}}
"""

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": CODEFORGE_AI_SYSTEM_PROMPT + "\nReturn only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.35,
        )

        content = response.choices[0].message.content

        try:
            data = extract_json_object(content)
            return AIPressureMessageResponse(**data)
        except Exception:
            return AIPressureMessageResponse(
                type=pressure_type,
                title="Execution is slipping",
                message="You have not secured enough verified progress today. Open Today and submit proof before momentum drops.",
                severity="medium",
            )

    def _fallback_daily_plan(
        self,
        *,
        milestone_title: str,
        focus_topic: str,
        max_daily_points: int,
    ) -> AIDailyPlanResponse:
        topic = focus_topic or milestone_title
        skill_tag = normalize_skill_tag(topic)

        build_points = min(100, max(65, max_daily_points - 100))

        return AIDailyPlanResponse(
            strategy=f"Fallback execution plan focused on applying {topic} through explanation, code, and a mini feature.",
            pressure_message="No idle mode. Learn the concept, prove it with code, then apply it in a small feature.",
            required_points=min(100, max_daily_points),
            items=[
                {
                    "slot": "learn",
                    "source": "new",
                    "existing_task_id": None,
                    "title": f"Explain {topic} through one backend scenario",
                    "description": (
                        f"Study {topic}. Submit a clear explanation, one small backend-focused example, "
                        "and one common mistake that would break the implementation."
                    ),
                    "task_type": TaskType.LEARNING,
                    "verification_type": VerificationType.TEXT,
                    "skill_tag": skill_tag,
                    "difficulty": 1,
                    "estimated_minutes": 25,
                    "reward_points": 35,
                    "required_score": 70,
                    "is_required": True,
                    "reason": "You need a clear base before writing proof-based code.",
                },
                {
                    "slot": "practice",
                    "source": "new",
                    "existing_task_id": None,
                    "title": f"Implement a focused {topic} example with one edge case",
                    "description": (
                        f"Write a working code example using {topic}. "
                        "Submit the code, explain the important logic, and include one edge case or failure scenario."
                    ),
                    "task_type": TaskType.CODING,
                    "verification_type": VerificationType.MIXED,
                    "skill_tag": skill_tag,
                    "difficulty": 2,
                    "estimated_minutes": 40,
                    "reward_points": 65,
                    "required_score": 70,
                    "is_required": True,
                    "reason": "CodeForge needs implementation proof, not passive reading.",
                },
                {
                    "slot": "build",
                    "source": "new",
                    "existing_task_id": None,
                    "title": f"Build a mini feature that uses {topic}",
                    "description": (
                        f"Apply {topic} inside a small practical feature. "
                        "Submit code, explain the architecture, and describe how you would test the feature."
                    ),
                    "task_type": TaskType.BUILD,
                    "verification_type": VerificationType.MIXED,
                    "skill_tag": skill_tag,
                    "difficulty": 3,
                    "estimated_minutes": 70,
                    "reward_points": build_points,
                    "required_score": 70,
                    "is_required": True,
                    "reason": "The build task proves you can apply the concept in a real feature.",
                },
            ],
        )

    async def generate_exam_checkpoint(
        self,
        user,
        *,
        skill_name: str,
        language: str | None,
        difficulty: int,
        recent_submissions: list[dict],
        weak_skills: list[str],
    ) -> dict:
        model = self.get_model_for_user(user)

        prompt = f"""
Generate a CodeForge checkpoint exam.

Skill: {skill_name}
Language: {language or "not specified"}
Difficulty: {difficulty}/5

User weak skills:
{compact_json(weak_skills)}

Recent submissions:
{compact_json(recent_submissions)}

Rules:
- This exam must be harder than a normal build task, but not insane.
- It must be practical and proof-based.
- It must be based on the user's recent mistakes and weak areas.
- Require code or a concrete technical solution.
- Require reasoning, edge cases, and improvement notes.
- No generic "build a calculator" unless the skill actually requires it.
- Must include anti-copy proof requirements.
- Return ONLY valid JSON.
- No markdown.
- No code fences.

JSON shape:
{{
  "title": "Specific checkpoint exam title",
  "task_title": "Specific pressure task title",
  "task_description": "Detailed exam task. Include what to build/explain and what proof to submit.",
  "expected_proof": [
    "Working code or concrete technical solution",
    "Explanation of core logic",
    "At least one edge case",
    "Why the approach works",
    "What to improve next"
  ]
}}
"""

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": CODEFORGE_AI_SYSTEM_PROMPT + "\nReturn only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
        )

        content = response.choices[0].message.content

        try:
            return extract_json_object(content)
        except Exception:
            return {
                "title": f"{skill_name.title()} Checkpoint Exam",
                "task_title": f"Prove {skill_name.title()} under pressure",
                "task_description": (
                    f"Build or explain a realistic solution using {skill_name}. "
                    "Include working proof, reasoning, edge cases, and improvement notes."
                ),
                "expected_proof": [
                    "Working code or concrete technical solution",
                    "Explanation of core logic",
                    "At least one edge case",
                    "Why the approach works",
                    "What to improve next",
                ],
            }