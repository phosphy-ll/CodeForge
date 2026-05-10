from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.models.user import User
from app.repositories.goal_repository import GoalRepository
from app.repositories.milestone_repository import MilestoneRepository
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskCardResponse
from app.domain.enums import TaskStatus


class TaskService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.goal_repo = GoalRepository(session)
        self.milestone_repo = MilestoneRepository(session)
        self.task_repo = TaskRepository(session)
        self.submission_repo = SubmissionRepository(session)

    async def create_task(self, user: User, data: TaskCreate) -> Task:
        milestone = await self.milestone_repo.get_by_id(data.milestone_id)
        if not milestone:
            raise ValueError("Milestone not found")

        goal = await self.goal_repo.get_by_id(milestone.goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Milestone not found")

        task = Task(
            milestone_id=data.milestone_id,
            title=data.title,
            description=data.description,
            task_type=data.task_type.value,
            verification_type=data.verification_type.value,
            max_attempts=data.max_attempts,
            required_score=data.required_score,
            reward_points=data.reward_points,
            is_required=data.is_required,
            unlock_condition_text=data.unlock_condition_text,
            difficulty=data.difficulty,
            estimated_minutes=data.estimated_minutes,
            status="available",
        )
        return await self.task_repo.create(task)

    async def get_task_detail(self, user: User, task_id: int) -> Task:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise ValueError("Task not found")

        milestone = await self.milestone_repo.get_by_id(task.milestone_id)
        goal = await self.goal_repo.get_by_id(milestone.goal_id)

        if not goal or goal.user_id != user.id:
            raise ValueError("Task not found")

        return task

    async def get_milestone_tasks(self, user: User, milestone_id: int):
        milestone = await self.milestone_repo.get_by_id(milestone_id)
        if not milestone:
            raise ValueError("Milestone not found")

        goal = await self.goal_repo.get_by_id(milestone.goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Milestone not found")

        return await self.task_repo.get_by_milestone_id(milestone_id)

    async def skip_task(self, user: User, task_id: int) -> Task:
        task = await self.get_task_detail(user, task_id)

        failed_attempts = await self.submission_repo.count_failed_attempts(task.id, user.id)

        if failed_attempts <= 5:
            raise ValueError("You must fail more than 5 times to skip this task")

        task.status = TaskStatus.SKIPPED.value
        return await self.task_repo.update(task)

    async def build_task_card(self, user: User, task: Task) -> TaskCardResponse:
        attempts_used = await self.submission_repo.count_attempts(task.id, user.id)
        failed_attempts = await self.submission_repo.count_failed_attempts(task.id, user.id)
        last_submission = await self.submission_repo.get_latest(task.id, user.id)

        attempts_left = max(task.max_attempts - attempts_used, 0)

        can_submit = (
            task.status in [
                TaskStatus.AVAILABLE.value,
                TaskStatus.IN_PROGRESS.value,
                TaskStatus.NEEDS_REVISION.value,
                TaskStatus.FAILED.value,
            ]
            and attempts_left > 0
        )

        can_skip = failed_attempts > 5

        can_request_manual_review = (
            last_submission is not None and not last_submission.manual_review_requested
        )

        return TaskCardResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            task_type=task.task_type,
            verification_type=task.verification_type,
            status=task.status,
            difficulty=task.difficulty,
            estimated_minutes=task.estimated_minutes,
            reward_points=task.reward_points,
            required_score=task.required_score,
            is_required=task.is_required,
            unlock_condition_text=task.unlock_condition_text,
            attempts_used=attempts_used,
            failed_attempts=failed_attempts,
            attempts_left=attempts_left,
            last_submission_status=last_submission.status if last_submission else None,
            last_submission_score=last_submission.score if last_submission else None,
            last_submission_feedback=last_submission.feedback if last_submission else None,
            manual_review_requested=last_submission.manual_review_requested if last_submission else False,
            can_submit=can_submit,
            can_skip=can_skip,
            can_request_manual_review=can_request_manual_review,
        )


    async def get_milestone_task_cards(self, user: User, milestone_id: int) -> list[TaskCardResponse]:
        tasks = await self.get_milestone_tasks(user, milestone_id)
        return [await self.build_task_card(user, task) for task in tasks]