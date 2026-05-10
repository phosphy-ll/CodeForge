from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.schemas.ai import (
    AIQuizGenerateRequest,
    AIQuizGenerateResponse,
    AITaskGenerateRequest,
    AILearnTopicRequest,
    AILearnTopicResponse,
    AICoachRequest,
    AICoachResponse,
    AIWeaknessMapResponse,
    AICoachChatRequest,
    AICoachChatResponse,
)
from app.schemas.task import TaskResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate-tasks", response_model=list[TaskResponse], status_code=status.HTTP_201_CREATED)
async def generate_tasks(
    data: AITaskGenerateRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = AIService(db)
    try:
        tasks = await service.generate_tasks_for_milestone(
            current_user,
            goal_id=data.goal_id,
            milestone_id=data.milestone_id,
            count=data.count,
            focus_topic=data.focus_topic,
        )
        return [TaskResponse.model_validate(task) for task in tasks]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/generate-quiz", response_model=AIQuizGenerateResponse)
async def generate_quiz(
    data: AIQuizGenerateRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = AIService(db)
    try:
        return await service.generate_quiz_for_task(
            current_user,
            task_id=data.task_id,
            topic=data.topic,
            question_count=data.question_count,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/learn-topic", response_model=AILearnTopicResponse)
async def learn_topic(
    data: AILearnTopicRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = AIService(db)
    try:
        return await service.learn_topic(
            current_user,
            goal_id=data.goal_id,
            topic=data.topic,
            language=data.language,
            level=data.level,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/learn-task/{task_id}", response_model=AILearnTopicResponse)
async def learn_task(
    task_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = AIService(db)
    try:
        return await service.learn_task(
            current_user,
            task_id=task_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/coach", response_model=AICoachResponse)
async def coach_user(
    data: AICoachRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = AIService(db)
    try:
        return await service.coach_user(current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get("/weakness-map", response_model=AIWeaknessMapResponse)
async def get_weakness_map(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = AIService(db)
    return await service.get_weakness_map(current_user)

@router.post("/coach/chat", response_model=AICoachChatResponse)
async def coach_chat(
    data: AICoachChatRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = AIService(db)
    try:
        return await service.coach_chat(
            current_user,
            message=data.message,
            goal_id=data.goal_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc