import json
import re

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
You are CodeForge AI Coach.

Generate strict proof-based coding tasks.

Context:
Goal: {goal_title}
Milestone: {milestone_title}
Focus topic: {focus_topic or milestone_title}
Required task count: {count}

User weak areas:
{weak_skills_text}

Rules:
- Generate EXACTLY {count} unique tasks.
- No duplicate tasks.
- No generic titles like "Practice string", "Learn basics", "Do exercise".
- Every task must be specific, practical, and verifiable.
- Each task must include skill_tag.
- Titles must be highly specific and descriptive.
- Do NOT use vague words like "practice", "learn", "basics".
- Each task must clearly differ from the others.
- Do not generate similar tasks with slightly different wording.
- skill_tag must be a short technical keyword (e.g. "loops", "error_handling", "sql_joins").
- If weak areas are not None, naturally train those weak skills.
- Include a mix of learning, coding, and build tasks when appropriate.
- The user must submit proof, not just mark done.
- For coding/build tasks, require explanation of design choices.
- required_score should usually be 70.
- reward_points:
  - learning: 35
  - coding: 65
  - build: 100
- Return ONLY valid JSON.
- No markdown.
- No code fences.

JSON shape:
{{
  "tasks": [
    {{
      "title": "Specific task title",
      "description": "Specific task instructions. Include what proof to submit and what to explain.",
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
            temperature=0.35,
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
        skill_tag = str(topic).strip().lower().replace(" ", "_")

        templates = [
            {
                "title": f"Explain the core idea of {topic}",
                "description": (
                    f"Study {topic} and explain the core idea in your own words. "
                    "Submit an explanation, one example, and describe where this concept is used in real backend development."
                ),
                "task_type": TaskType.LEARNING,
                "verification_type": VerificationType.TEXT,
                "skill_tag": skill_tag,
                "difficulty": 1,
                "estimated_minutes": 20,
                "reward_points": 35,
            },
            {
                "title": f"Build a small example for {topic}",
                "description": (
                    f"Create a working code example related to {topic}. "
                    "Submit the code and explain how it works line by line."
                ),
                "task_type": TaskType.CODING,
                "verification_type": VerificationType.MIXED,
                "skill_tag": skill_tag,
                "difficulty": 2,
                "estimated_minutes": 35,
                "reward_points": 65,
            },
            {
                "title": f"Find edge cases in {topic}",
                "description": (
                    f"Analyze {topic} and list at least three edge cases or common failure points. "
                    "Explain how you would prevent them in a real project."
                ),
                "task_type": TaskType.LEARNING,
                "verification_type": VerificationType.TEXT,
                "skill_tag": skill_tag,
                "difficulty": 2,
                "estimated_minutes": 25,
                "reward_points": 35,
            },
            {
                "title": f"Apply {topic} inside a mini backend feature",
                "description": (
                    f"Use {topic} to implement a small backend feature. "
                    "Submit code, explain your architecture, and describe why your solution works."
                ),
                "task_type": TaskType.BUILD,
                "verification_type": VerificationType.MIXED,
                "skill_tag": skill_tag,
                "difficulty": 3,
                "estimated_minutes": 60,
                "reward_points": 100,
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
Create a practical learning explanation before the user starts a coding task.

Goal: {goal_title}
Topic: {topic}
Language: {language or "not specified"}
User level: {level or "beginner"}

Rules:
- Explain clearly and practically.
- Do not be too academic.
- Focus on what the user needs to understand before doing a task.
- Include common mistakes.
- Include a small example.
- Include proof requirements.
- Do not mention that you are an AI.
- Return ONLY valid JSON.
- No markdown.
- No code fences.

JSON shape:
{{
  "title": "Topic title",
  "explanation": "Clear explanation of the topic.",
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
            temperature=0.35,
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
{weak_skills or ["none"]}

Recent submissions:
{recent_submissions or ["none"]}

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
            temperature=0.3,
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
    You are CodeForge AI Coach.

    User message:
    {message}

    User weak skills:
    {weak_skills or ["none"]}

    Recent submissions:
    {recent_submissions or ["none"]}

    Rules:
    - Answer like a strict execution mentor.
    - Be practical and specific.
    - No motivational fluff.
    - Do not mention that you are an AI.
    - Push toward proof-based execution.
    - If the user asks what to do next, give concrete next steps.
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
                temperature=0.35,
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
            temperature=0.25,
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

        existing_tasks_text = json.dumps(existing_tasks, ensure_ascii=False)
        unfinished_tasks_text = json.dumps(unfinished_tasks, ensure_ascii=False)
        weak_skills_text = json.dumps(weak_skills, ensure_ascii=False)
        recent_submissions_text = json.dumps(recent_submissions, ensure_ascii=False)

        prompt = f"""
You are CodeForge AI Daily Planner.

CodeForge is not a learning platform. It is an execution system.

Your job:
Generate ONE strict daily execution plan for the user.

The day structure MUST be:
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

Rules:
- Return EXACTLY 3 items: learn, practice, build.
- The order must be learn → practice → build.
- Use unfinished old tasks if they are still important. Do not let users escape unfinished work.
- Use existing tasks when they fit today's plan.
- Generate new tasks when existing tasks are weak, generic, duplicate, or do not fit the day structure.
- Weakness focus should be around 50% of the plan, not 100%.
- The plan must be fixed for the day.
- The user may regenerate, but regeneration must create a completely new plan.
- Do not generate generic titles like "Practice string", "Learn basics", "Do exercise".
- Titles must be specific and verifiable.
- Every task must require proof.
- Every task must include a reason explaining why it is in today's plan.
- reward_points:
  - learning: 35
  - coding: 65
  - build: 100
- Total reward_points should not exceed max_daily_points.
- required_score should usually be 70.
- If source is "existing", existing_task_id must be a real id from existing_tasks or unfinished_tasks.
- If source is "new", existing_task_id must be null.
- Return ONLY valid JSON.
- No markdown.
- No code fences.

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
            temperature=0.3,
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

CodeForge is not a motivation app. It is an execution system.

Generate ONE short in-app notification.

Context:
Pressure type: {pressure_type}
Earned points today: {earned_points_today}
Required points today: {required_points}
Pressure level: {pressure_level}
AI strictness: {ai_strictness}

Unfinished tasks:
{json.dumps(unfinished_tasks, ensure_ascii=False)}

Recent submissions:
{json.dumps(recent_submissions, ensure_ascii=False)}

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
            temperature=0.45,
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
        skill_tag = str(topic).strip().lower().replace(" ", "_")

        return AIDailyPlanResponse(
            strategy=f"Fallback execution plan focused on {topic}.",
            pressure_message="No idle mode. Complete the learning task, prove practice, then build something small.",
            required_points=min(100, max_daily_points),
            items=[
                {
                    "slot": "learn",
                    "source": "new",
                    "existing_task_id": None,
                    "title": f"Explain {topic} with a backend example",
                    "description": (
                        f"Study {topic}. Submit a clear explanation, one backend-focused example, "
                        "and explain where this appears in real projects."
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
                    "title": f"Implement a focused example using {topic}",
                    "description": (
                        f"Write a small working code example using {topic}. "
                        "Submit the code and explain the important decisions."
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
                    "title": f"Build a mini feature around {topic}",
                    "description": (
                        f"Apply {topic} inside a small backend feature. "
                        "Submit code, explain the architecture, and list edge cases."
                    ),
                    "task_type": TaskType.BUILD,
                    "verification_type": VerificationType.MIXED,
                    "skill_tag": skill_tag,
                    "difficulty": 3,
                    "estimated_minutes": 70,
                    "reward_points": min(100, max_daily_points),
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
{weak_skills or ["none"]}

Recent submissions:
{recent_submissions or ["none"]}

Rules:
- This exam must be harder than a normal build task, but not insane.
- It must be practical and proof-based.
- It must be based on the user's recent mistakes and weak areas.
- Require code or a concrete technical solution.
- Require reasoning, edge cases, and improvement notes.
- No generic "build a calculator" unless the skill actually requires it.
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
            temperature=0.3,
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