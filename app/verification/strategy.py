"""Strategy-based task verification for CodeForge.

Only AI verification can return a grade to the existing submission pipeline.
Evidence-only strategies never award points or claim that a task is verified.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Protocol
from urllib.parse import urlparse

import httpx


COMMIT_PATH = re.compile(r"^/([A-Za-z0-9-]{1,39})/([A-Za-z0-9_.-]{1,100})/commit/([a-fA-F0-9]{7,40})/?$")


@dataclass(frozen=True)
class VerificationContext:
    user: Any = None
    task_title: str = ""
    task_description: str = ""
    task_type: str = ""
    verification_type: str = ""
    required_score: int = 70
    submission_text: str | None = None
    submission_code: str | None = None
    submission_link: str | None = None
    workflow_run_id: int | None = None


@dataclass
class VerificationResult:
    strategy: str
    state: str
    message: str
    evidence_confirmed: bool = False
    score: int | None = None
    feedback: dict[str, Any] = field(default_factory=dict)
    details: dict[str, Any] = field(default_factory=dict)

    def to_legacy_review(self) -> dict[str, Any]:
        if self.strategy != "ai" or self.score is None:
            raise ValueError("Evidence-only strategy cannot grade submissions")
        return {"score": self.score, **self.feedback}


class VerificationStrategy(Protocol):
    async def verify(self, context: VerificationContext) -> VerificationResult: ...


class AIReviewStrategy:
    def __init__(self, ai_service: Any):
        self.ai_service = ai_service

    async def verify(self, context: VerificationContext) -> VerificationResult:
        result = await self.ai_service.review_submission(
            user=context.user,
            task_title=context.task_title,
            task_description=context.task_description,
            task_type=context.task_type,
            verification_type=context.verification_type,
            required_score=context.required_score,
            submission_text=context.submission_text,
            submission_code=context.submission_code,
            submission_link=context.submission_link,
        )
        score = int(result.get("score", 0))
        score = min(100, max(0, score))
        return VerificationResult(
            strategy="ai", state="graded", message="AI review completed",
            score=score,
            feedback={key: value for key, value in result.items() if key != "score"},
        )


class ManualReviewStrategy:
    async def verify(self, context: VerificationContext) -> VerificationResult:
        return VerificationResult(
            strategy="manual", state="requires_review",
            message="A reviewer must make the final decision using the existing manual-review endpoint.",
        )


def parse_public_commit_url(url: str | None) -> tuple[str, str, str] | None:
    if not url or len(url) > 500:
        return None
    parsed = urlparse(url)
    if (
        parsed.scheme != "https"
        or parsed.netloc.lower() != "github.com"
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
    ):
        return None
    match = COMMIT_PATH.fullmatch(parsed.path)
    if not match:
        return None
    owner, repo, sha = match.groups()
    if repo in {".", ".."} or repo.endswith(".git"):
        return None
    return owner, repo, sha.lower()


class _GitHubStrategyBase:
    def __init__(self, transport: httpx.AsyncBaseTransport | None = None):
        self.transport = transport

    async def github_get(self, path: str) -> tuple[int, dict[str, Any]]:
        async with httpx.AsyncClient(
            base_url="https://api.github.com",
            timeout=6,
            follow_redirects=False,
            transport=self.transport,
            headers={"Accept": "application/vnd.github+json", "User-Agent": "CodeForge-Verification"},
        ) as client:
            try:
                response = await client.get(path)
                if response.status_code == 404:
                    return 404, {}
                if response.status_code != 200 or len(response.content) > 256_000:
                    return 503, {}
                payload = response.json()
                return (200, payload) if isinstance(payload, dict) else (503, {})
            except (httpx.HTTPError, ValueError):
                return 503, {}


class GitHubEvidenceStrategy(_GitHubStrategyBase):
    async def verify(self, context: VerificationContext) -> VerificationResult:
        parsed = parse_public_commit_url(context.submission_link)
        if parsed is None:
            return VerificationResult("github", "invalid_evidence", "Use a public GitHub commit URL (HTTPS).")
        owner, repo, sha = parsed
        code, payload = await self.github_get(f"/repos/{owner}/{repo}/git/commits/{sha}")
        if code != 200:
            state = "not_found" if code == 404 else "unavailable"
            return VerificationResult("github", state, "Commit could not be confirmed from GitHub.")
        returned_sha = str(payload.get("sha", "")).lower()
        if not returned_sha.startswith(sha) or not returned_sha:
            return VerificationResult("github", "invalid_evidence", "GitHub returned a different commit.")
        return VerificationResult(
            "github", "evidence_found", "Public commit exists; code quality and task completion still need review.",
            evidence_confirmed=True,
            details={"repository": f"{owner}/{repo}", "commit": returned_sha},
        )


class AutomatedTestsEvidenceStrategy(_GitHubStrategyBase):
    async def verify(self, context: VerificationContext) -> VerificationResult:
        parsed = parse_public_commit_url(context.submission_link)
        run_id = context.workflow_run_id
        if parsed is None or not isinstance(run_id, int) or not (1 <= run_id <= 10**14):
            return VerificationResult(
                "automated_tests", "invalid_evidence",
                "Provide a public GitHub commit URL and a GitHub Actions workflow run ID.",
            )
        owner, repo, sha = parsed
        code, payload = await self.github_get(f"/repos/{owner}/{repo}/actions/runs/{run_id}")
        if code != 200:
            return VerificationResult(
                "automated_tests", "not_found" if code == 404 else "unavailable",
                "GitHub Actions run could not be confirmed.",
            )
        actual_sha = str(payload.get("head_sha", "")).lower()
        full_name = str((payload.get("repository") or {}).get("full_name", "")).lower()
        valid_run = (
            actual_sha.startswith(sha) and bool(actual_sha)
            and full_name == f"{owner}/{repo}".lower()
            and payload.get("status") == "completed"
            and payload.get("conclusion") == "success"
        )
        if not valid_run:
            return VerificationResult(
                "automated_tests", "invalid_evidence",
                "The run is not successful, complete, or linked to the specified repository/commit.",
            )
        return VerificationResult(
            "automated_tests", "evidence_found",
            "GitHub reports a successful CI run for this commit; it does not establish task correctness by itself.",
            evidence_confirmed=True,
            details={"repository": f"{owner}/{repo}", "commit": actual_sha, "run_id": run_id},
        )


class VerificationService:
    """Context: delegates work through one interchangeable Strategy interface."""

    def __init__(self, ai_service: Any, transport: httpx.AsyncBaseTransport | None = None):
        self.strategies: dict[str, VerificationStrategy] = {
            "ai": AIReviewStrategy(ai_service),
            "github": GitHubEvidenceStrategy(transport),
            "automated_tests": AutomatedTestsEvidenceStrategy(transport),
            "manual": ManualReviewStrategy(),
        }

    async def verify(self, strategy: str, context: VerificationContext) -> VerificationResult:
        implementation = self.strategies.get(strategy)
        if implementation is None:
            raise ValueError("Unknown verification strategy")
        return await implementation.verify(context)

    async def precheck_submission(self, user: Any, **kwargs: Any) -> dict[str, Any]:
        """Preserve the existing optional AI precheck used by SubmissionService."""
        return await self.strategies["ai"].ai_service.precheck_submission(user, **kwargs)

    async def review_submission(self, **kwargs: Any) -> dict[str, Any]:
        """Compatibility adapter for CodeForge's existing AI review code path."""
        outcome = await self.verify("ai", VerificationContext(**kwargs))
        return outcome.to_legacy_review()
