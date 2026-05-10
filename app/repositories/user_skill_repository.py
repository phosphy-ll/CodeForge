from sqlalchemy import select

from app.models.user_skill import UserSkill


class UserSkillRepository:
    def __init__(self, session):
        self.session = session

    async def get_by_user(self, user_id: int):
        result = await self.session.execute(
            select(UserSkill).where(UserSkill.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_or_create(self, user_id: int, skill: str):
        result = await self.session.execute(
            select(UserSkill).where(
                UserSkill.user_id == user_id,
                UserSkill.skill_name == skill,
            )
        )
        obj = result.scalar_one_or_none()

        if obj:
            return obj

        obj = UserSkill(user_id=user_id, skill_name=skill, weakness_score=0.5)
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def update_score(self, obj: UserSkill, delta: float):
        obj.weakness_score = min(1.0, max(0.0, obj.weakness_score + delta))
        await self.session.flush()
        return obj