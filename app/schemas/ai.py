from pydantic import BaseModel, Field

from app.domain.enums import TaskType, VerificationType


class AITaskGenerateRequest(BaseModel):
    goal_id: int
    milestone_id: int
    count: int = Field(default=3, ge=1, le=10)
    focus_topic: str | None = Field(default=None, max_length=200)


class AIGeneratedTaskItem(BaseModel):
    title: str
    description: str
    task_type: TaskType
    verification_type: VerificationType
    skill_tag: str | None = None
    difficulty: int = Field(ge=1, le=5)
    estimated_minutes: int = Field(ge=1, le=1440)
    reward_points: int = Field(ge=1, le=1000)
    required_score: int = Field(default=70, ge=0, le=100)
    is_required: bool = True
    unlock_condition_text: str | None = None


class AITaskGenerateResponse(BaseModel):
    tasks: list[AIGeneratedTaskItem]


class AIQuizGenerateRequest(BaseModel):
    task_id: int
    topic: str = Field(min_length=2, max_length=200)
    question_count: int = Field(default=5, ge=3, le=10)


class AIQuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str


class AIQuizGenerateResponse(BaseModel):
    title: str
    question_count: int
    potential_reward_points: int
    questions: list[AIQuizQuestion]

class AILearnTopicRequest(BaseModel):
    goal_id: int
    topic: str = Field(min_length=2, max_length=200)
    language: str | None = Field(default=None, max_length=50)
    level: str | None = Field(default=None, max_length=50)


class AILearnTopicResponse(BaseModel):
    title: str
    explanation: str
    key_points: list[str]
    common_mistakes: list[str]
    mini_example: str
    practice_prompt: str
    proof_requirements: list[str]

class AICoachRequest(BaseModel):
    goal_id: int | None = None


class AICoachAction(BaseModel):
    type: str
    title: str
    reason: str


class AICoachResponse(BaseModel):
    summary: str
    severity: str
    weak_areas: list[str]
    strengths: list[str]
    diagnosis: str
    next_actions: list[AICoachAction]
    recommended_focus: str
    warning: str | None = None
    pressure_message: str
    execution_risk: str

class AIWeaknessItem(BaseModel):
    skill_name: str
    weakness_score: float
    level: str


class AIWeaknessMapResponse(BaseModel):
    items: list[AIWeaknessItem]

class AIDailyPlanItem(BaseModel):
    slot: str = Field(pattern="^(learn|practice|build)$")
    source: str = Field(pattern="^(existing|new)$")

    existing_task_id: int | None = None

    title: str
    description: str
    task_type: TaskType
    verification_type: VerificationType
    skill_tag: str | None = None
    difficulty: int = Field(ge=1, le=5)
    estimated_minutes: int = Field(ge=1, le=1440)
    reward_points: int = Field(ge=1, le=1000)
    required_score: int = Field(default=70, ge=0, le=100)
    is_required: bool = True
    reason: str


class AIDailyPlanResponse(BaseModel):
    strategy: str
    pressure_message: str
    required_points: int
    items: list[AIDailyPlanItem]

class AIPressureMessageResponse(BaseModel):
    type: str
    title: str
    message: str
    severity: str

class AICoachChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=2000)
    goal_id: int | None = None


class AICoachChatResponse(BaseModel):
    answer: str
    suggested_actions: list[str]