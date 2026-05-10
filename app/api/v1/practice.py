from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.repositories.user_skill_repository import UserSkillRepository
from app.schemas.practice import (
    PracticeAttemptResponse,
    PracticeRequest,
    PracticeResponse,
    PracticeDrill,
    PracticeDrillsResponse,
    PracticeSkillFocus,
)
from app.services.practice_service import PracticeService

router = APIRouter(prefix="/practice", tags=["Practice"])


@router.get("/drills", response_model=PracticeDrillsResponse)
async def get_practice_drills(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    skill_repo = UserSkillRepository(db)
    skills = await skill_repo.get_by_user(current_user.id)

    normalized = []

    for skill in skills:
        weakness_score = float(skill.weakness_score or 0)
        weakness_percent = int(round(weakness_score * 100))

        normalized.append(
            {
                "skill_name": skill.skill_name,
                "weakness_score": weakness_score,
                "weakness_percent": weakness_percent,
                "tier": get_tier(weakness_percent),
            }
        )

    normalized.sort(key=lambda item: item["weakness_percent"], reverse=True)

    focus_skill = PracticeSkillFocus(**normalized[0]) if normalized else None

    recovery_drills = []
    stabilization_drills = []
    mastery_drills = []

    for item in normalized:
        drill = build_drill(item)

        if item["tier"] == "high":
            recovery_drills.append(drill)
        elif item["tier"] == "medium":
            stabilization_drills.append(drill)
        else:
            mastery_drills.append(drill)

    return PracticeDrillsResponse(
        focus_skill=focus_skill,
        recovery_drills=recovery_drills[:5],
        stabilization_drills=stabilization_drills[:5],
        mastery_drills=mastery_drills[:6],
    )


@router.post("/drill", response_model=PracticeResponse)
async def practice_drill(
    data: PracticeRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
    skill_name: str,
    action_type: str = "practice",
):
    service = PracticeService(db)
    try:
        result = await service.practice_drill(
            current_user,
            skill_name=skill_name,
            action_type=action_type,
            content_text=data.content_text,
            content_code=data.content_code,
        )
        return PracticeResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/task/{task_id}", response_model=PracticeResponse)
async def practice_task(
    task_id: int,
    data: PracticeRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = PracticeService(db)
    try:
        result = await service.practice_task(
            current_user,
            task_id=task_id,
            content_text=data.content_text,
            content_code=data.content_code,
        )
        return PracticeResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/me", response_model=list[PracticeAttemptResponse])
async def get_my_attempts(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = PracticeService(db)
    items = await service.get_my_attempts(current_user)
    return [PracticeAttemptResponse.model_validate(x) for x in items]


@router.get("/task/{task_id}/history", response_model=list[PracticeAttemptResponse])
async def get_my_task_attempts(
    task_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = PracticeService(db)
    items = await service.get_my_task_attempts(current_user, task_id)
    return [PracticeAttemptResponse.model_validate(x) for x in items]


def get_tier(weakness_percent: int) -> str:
    if weakness_percent >= 70:
        return "high"
    if weakness_percent > 40:
        return "medium"
    if weakness_percent > 15:
        return "low"
    if weakness_percent > 5:
        return "good"
    return "master"


def build_drill(item: dict) -> PracticeDrill:
    skill = item["skill_name"]
    tier = item["tier"]
    percent = item["weakness_percent"]
    formatted_skill = format_skill(skill)

    if tier == "high":
        return PracticeDrill(
            id=f"recovery-{skill}",
            skill_name=skill,
            tier=tier,
            title=f"Recover {formatted_skill} execution",
            description=f"Complete a focused drill on {formatted_skill}. Submit working proof and explain the core logic clearly.",
            difficulty=3,
            estimated_minutes=35,
            reward_points=65,
            reason=f"{formatted_skill} is high risk at {percent}% weakness.",
            action_type="recovery",
        )

    if tier == "medium":
        return PracticeDrill(
            id=f"stabilize-{skill}",
            skill_name=skill,
            tier=tier,
            title=f"Stabilize {formatted_skill}",
            description=f"Solve a practical exercise using {formatted_skill}. Focus on reasoning, edge cases, and explanation quality.",
            difficulty=2,
            estimated_minutes=25,
            reward_points=45,
            reason=f"{formatted_skill} is unstable at {percent}% weakness.",
            action_type="stabilization",
        )

    return PracticeDrill(
        id=f"mastery-{skill}",
        skill_name=skill,
        tier=tier,
        title=f"Keep {formatted_skill} sharp",
        description=f"Do a short maintenance drill for {formatted_skill}. Keep the skill warm without wasting daily pressure.",
        difficulty=1,
        estimated_minutes=15,
        reward_points=25,
        reason=f"{formatted_skill} is currently stable at {percent}% weakness.",
        action_type="mastery",
    )


def format_skill(value: str) -> str:
    return value.replace("_", " ").title()