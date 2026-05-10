from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.schemas.exam import (
    AttemptSubmitResponse,
    ExamAttemptResponse,
    ExamGenerateRequest,
    ExamGenerateResponse,
    ExamSubmitRequest,
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizSubmitRequest,
)
from app.services.exam_service import ExamService

router = APIRouter(prefix="/exams", tags=["Exams"])


@router.post("/quiz/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    data: QuizGenerateRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = ExamService(db)
    try:
        return await service.generate_quiz(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/quiz/submit", response_model=AttemptSubmitResponse)
async def submit_quiz(
    data: QuizSubmitRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = ExamService(db)
    try:
        return await service.submit_quiz(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/generate", response_model=ExamGenerateResponse)
async def generate_exam(
    data: ExamGenerateRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = ExamService(db)
    try:
        return await service.generate_exam(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/submit", response_model=AttemptSubmitResponse)
async def submit_exam(
    data: ExamSubmitRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = ExamService(db)
    try:
        return await service.submit_exam(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{attempt_id}/request-manual-review", response_model=ExamAttemptResponse)
async def request_exam_manual_review(
    attempt_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = ExamService(db)
    try:
        attempt = await service.request_manual_review(current_user, attempt_id)
        return ExamAttemptResponse.model_validate(attempt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc