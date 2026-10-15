"""Authenticated, read-only evidence inspection. Does not award task points."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.core.rate_limit import rate_limiter
from app.models.user import User
from app.verification.strategy import VerificationContext, VerificationService
from app.ai.review_service import AIReviewService

router = APIRouter(prefix="/verification", tags=["Verification"])


class EvidenceCheckRequest(BaseModel):
    strategy: Literal["github", "automated_tests", "manual"]
    submission_link: str | None = Field(default=None, max_length=500)
    workflow_run_id: int | None = Field(default=None, ge=1, le=10**14)


@router.post("/check-evidence")
async def check_evidence(
    data: EvidenceCheckRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    if not rate_limiter.check(
        f"verification:evidence:{current_user.id}", limit=12, window_seconds=60
    ):
        raise HTTPException(status_code=429, detail="Too many evidence checks")

    # Intentionally does not perform review_submission / progress mutation.
    service = VerificationService(AIReviewService())
    result = await service.verify(
        data.strategy,
        VerificationContext(
            user=current_user,
            submission_link=data.submission_link,
            workflow_run_id=data.workflow_run_id,
        ),
    )
    if result.state == "unavailable":
        raise HTTPException(status_code=503, detail="Evidence source unavailable")
    return {
        "strategy": result.strategy,
        "state": result.state,
        "message": result.message,
        "evidence_confirmed": result.evidence_confirmed,
        "details": result.details,
        "task_verified": False,
    }
