from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"
    REVIEWER = "reviewer"


class SubscriptionTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PLUS = "plus"
    ULTRA = "ultra"


class ProgrammingLanguage(str, Enum):
    PYTHON = "python"
    JAVA = "java"
    KOTLIN = "kotlin"


class GoalType(str, Enum):
    BACKEND_JOB = "backend_job"
    INTERNSHIP = "internship"
    LEARN_BACKEND = "learn_backend"
    BUILD_PROJECT = "build_project"
    PREPARE_INTERVIEW = "prepare_interview"
    SWITCH_LANGUAGE = "switch_language"


class CodingLevel(str, Enum):
    ABSOLUTE_BEGINNER = "absolute_beginner"
    BEGINNER = "beginner"
    JUNIOR = "junior"
    JUNIOR_PLUS = "junior_plus"
    INTERMEDIATE = "intermediate"


class LearningStyle(str, Enum):
    THEORY_FIRST = "theory_first"
    PRACTICE_FIRST = "practice_first"
    BALANCED = "balanced"
    PROJECT_BASED = "project_based"


class AccountabilityMode(str, Enum):
    SOFT = "soft"
    NORMAL = "normal"
    HARD = "hard"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MilestoneStatus(str, Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TaskType(str, Enum):
    LEARNING = "learning"
    CODING = "coding"
    BUILD = "build"


class VerificationType(str, Enum):
    TEXT = "text"
    QUIZ = "quiz"
    CODE = "code"
    LINK = "link"
    MIXED = "mixed"


class TaskStatus(str, Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    VERIFIED = "verified"
    NEEDS_REVISION = "needs_revision"
    FAILED = "failed"
    SKIPPED = "skipped"

class SubmissionStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    NEEDS_REVISION = "needs_revision"
    PARTIAL = "partial"


class ReviewerType(str, Enum):
    AI = "ai"
    RULE_BASED = "rule_based"
    MANUAL = "manual"


class PlanSource(str, Enum):
    AI_GENERATED = "ai_generated"
    MANUAL = "manual"
    HYBRID = "hybrid"


class LeaderboardPeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class AchievementCategory(str, Enum):
    STREAK = "streak"
    EXECUTION = "execution"
    PROJECT = "project"
    LEARNING = "learning"
    CODING = "coding"
    RECOVERY = "recovery"
