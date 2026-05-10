from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.submission_repository import SubmissionRepository


class RankService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.sub_repo = SubmissionRepository(session)

    async def update_rank(self, user: User):
        submissions = await self.sub_repo.get_by_task_and_user(None, user.id)

        verified_count = sum(
            1 for s in submissions if s.status == "verified"
        )

        new_rank = self._calculate_rank(verified_count)

        if user.rank != new_rank:
            user.rank = new_rank
            await self.session.commit()
            await self.session.refresh(user)

        return user.rank

    def _calculate_rank(self, verified_tasks: int) -> str:
        if verified_tasks >= 200:
            return "senior"
        if verified_tasks >= 120:
            return "strong_middle"
        if verified_tasks >= 70:
            return "middle"
        if verified_tasks >= 30:
            return "strong_junior"
        if verified_tasks >= 10:
            return "junior"
        return "trainee"
