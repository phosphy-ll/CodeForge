from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession, get_current_user, require_roles
from app.domain.enums import UserRole
from app.models.user import User
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionResponse,
    SubmissionReviewRequest,
    SubmissionPrecheckRequest,
    SubmissionPrecheckResponse,
    SubmissionFollowupAnswerRequest,
    SubmissionManualReviewRequest,
)
from app.services.submission_service import SubmissionService

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    data: SubmissionCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> SubmissionResponse:
    service = SubmissionService(db)
    try:
        submission = await service.create_submission(current_user, data)
        return SubmissionResponse.model_validate(submission)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/{submission_id}/review",
    response_model=SubmissionResponse,
)
async def review_submission(
    submission_id: int,
    data: SubmissionReviewRequest,
    db: DbSession,
    reviewer: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN.value,
                UserRole.REVIEWER.value,
            )
        ),
    ],
) -> SubmissionResponse:
    service = SubmissionService(db)
    try:
        submission = await service.review_submission(reviewer, submission_id, data)
        return SubmissionResponse.model_validate(submission)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/task/{task_id}", response_model=list[SubmissionResponse])
async def get_task_submissions(
    task_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = SubmissionService(db)
    submissions = await service.get_task_submissions(current_user, task_id)
    return [SubmissionResponse.model_validate(s) for s in submissions]


@router.post("/precheck", response_model=SubmissionPrecheckResponse)
async def precheck_submission(
    data: SubmissionPrecheckRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = SubmissionService(db)
    try:
        return await service.precheck_submission(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/{submission_id}/answer-followup", response_model=SubmissionResponse)
async def answer_followup(
    submission_id: int,
    data: SubmissionFollowupAnswerRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = SubmissionService(db)
    try:
        submission = await service.answer_followup(
            current_user,
            submission_id,
            data.answer,
        )
        return SubmissionResponse.model_validate(submission)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/{submission_id}/request-manual-review", response_model=SubmissionResponse)
async def request_manual_review(
    submission_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = SubmissionService(db)
    submission = await service.request_manual_review(current_user, submission_id)
    return SubmissionResponse.model_validate(submission)

@router.post("/{submission_id}/manual-review", response_model=SubmissionResponse)
async def manual_review_submission(
    submission_id: int,
    data: SubmissionManualReviewRequest,
    db: DbSession,
    reviewer: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN.value,
                UserRole.REVIEWER.value,
            )
        ),
    ],
) -> SubmissionResponse:
    service = SubmissionService(db)
    try:
        submission = await service.manual_review_submission(
            reviewer=reviewer,
            submission_id=submission_id,
            data=data,
        )
        return SubmissionResponse.model_validate(submission)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc