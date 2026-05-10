from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskCardResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> TaskResponse:
    service = TaskService(db)
    try:
        task = await service.create_task(current_user, data)
        return TaskResponse.model_validate(task)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/milestone/{milestone_id}", response_model=list[TaskResponse])
async def get_milestone_tasks(
    milestone_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[TaskResponse]:
    service = TaskService(db)
    try:
        tasks = await service.get_milestone_tasks(current_user, milestone_id)
        return [TaskResponse.model_validate(task) for task in tasks]
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = TaskService(db)
    task = await service.get_task_detail(current_user, task_id)
    return TaskResponse.model_validate(task)


@router.post("/{task_id}/skip", response_model=TaskResponse)
async def skip_task(
    task_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = TaskService(db)
    task = await service.skip_task(current_user, task_id)
    return TaskResponse.model_validate(task)

@router.get("/milestone/{milestone_id}/cards", response_model=list[TaskCardResponse])
async def get_milestone_task_cards(
    milestone_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[TaskCardResponse]:
    service = TaskService(db)
    try:
        return await service.get_milestone_task_cards(current_user, milestone_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc