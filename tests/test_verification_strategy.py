import asyncio

import httpx
import pytest

from app.verification.strategy import (
    VerificationContext, VerificationService, parse_public_commit_url,
)


class FakeAIService:
    async def review_submission(self, **kwargs):
        return {"score": 84, "feedback": "Good implementation", "suspicion_score": 0}

    async def precheck_submission(self, user, **kwargs):
        return {"can_submit": True, "confidence_score": 0.9, "confidence_label": "high", "rejection_risk": "low", "likely_issues": [], "tips": []}


def run(awaitable):
    return asyncio.run(awaitable)


def test_ai_adapter_keeps_current_contract():
    service = VerificationService(FakeAIService())
    outcome = run(service.review_submission(user=object(), task_title="Demo"))
    assert outcome == {"score": 84, "feedback": "Good implementation", "suspicion_score": 0}
    precheck = run(service.precheck_submission(user=object(), task_title="Demo"))
    assert precheck["can_submit"] is True


def test_manual_never_grades():
    service = VerificationService(FakeAIService())
    result = run(service.verify("manual", VerificationContext()))
    assert result.state == "requires_review"
    assert result.score is None
    with pytest.raises(ValueError):
        result.to_legacy_review()


@pytest.mark.parametrize("url", [
    "http://github.com/alice/demo/commit/abcdefa",
    "https://evil.com/alice/demo/commit/abcdefa",
    "https://github.com.evil.com/alice/demo/commit/abcdefa",
    "https://github.com@evil.com/alice/demo/commit/abcdefa",
    "https://github.com/alice/demo",
    "https://github.com/alice/demo/commit/not-a-sha",
    "https://github.com/alice/demo/commit/abcdefa?redirect=https://evil.com",
])
def test_github_url_rejects_unsafe_or_wrong_inputs(url):
    assert parse_public_commit_url(url) is None


def fake_transport(sha="abcdefabc123", run_success=True):
    def handle(request):
        path = request.url.path
        if path.endswith("/git/commits/abcdefa"):
            return httpx.Response(200, json={"sha": sha})
        if path.endswith("/actions/runs/42"):
            return httpx.Response(200, json={
                "head_sha": sha,
                "status": "completed",
                "conclusion": "success" if run_success else "failure",
                "repository": {"full_name": "alice/demo"},
            })
        return httpx.Response(404, json={"message": "Not Found"})
    return httpx.MockTransport(handle)


def test_github_valid_commit_is_evidence_only():
    service = VerificationService(FakeAIService(), transport=fake_transport())
    context = VerificationContext(submission_link="https://github.com/alice/demo/commit/abcdefa")
    outcome = run(service.verify("github", context))
    assert outcome.state == "evidence_found"
    assert outcome.evidence_confirmed
    assert outcome.score is None
    with pytest.raises(ValueError):
        outcome.to_legacy_review()


def test_github_missing_commit_is_not_verified():
    service = VerificationService(FakeAIService(), transport=fake_transport())
    outcome = run(service.verify("github", VerificationContext(submission_link="https://github.com/alice/demo/commit/fffffff")))
    assert outcome.state == "not_found"
    assert not outcome.evidence_confirmed


def test_successful_ci_run_is_evidence_not_a_grade():
    service = VerificationService(FakeAIService(), transport=fake_transport())
    context = VerificationContext(submission_link="https://github.com/alice/demo/commit/abcdefa", workflow_run_id=42)
    outcome = run(service.verify("automated_tests", context))
    assert outcome.state == "evidence_found"
    assert outcome.score is None


def test_failed_ci_run_is_invalid_evidence():
    service = VerificationService(FakeAIService(), transport=fake_transport(run_success=False))
    context = VerificationContext(submission_link="https://github.com/alice/demo/commit/abcdefa", workflow_run_id=42)
    outcome = run(service.verify("automated_tests", context))
    assert outcome.state == "invalid_evidence"
    assert not outcome.evidence_confirmed


def test_unknown_strategy_rejected():
    service = VerificationService(FakeAIService())
    with pytest.raises(ValueError):
        run(service.verify("shell_exec", VerificationContext()))


def test_ci_run_cannot_point_to_another_commit():
    service = VerificationService(FakeAIService(), transport=fake_transport(sha="fedcba999"))
    context = VerificationContext(submission_link="https://github.com/alice/demo/commit/abcdefa", workflow_run_id=42)
    outcome = run(service.verify("automated_tests", context))
    assert outcome.state == "invalid_evidence"


# Regression tests for feedback consistency after a follow-up answer.
from types import SimpleNamespace

from app.verification.review_state import apply_review_explanations


def test_passed_first_review_has_no_failure_explanation_or_followup():
    submission = SimpleNamespace(
        why_not_verified="old issue",
        improvement_steps="old step",
        followup_question="obsolete question",
        followup_answer=None,
    )
    apply_review_explanations(
        submission,
        status="verified",
        why_not_verified="AI suggested additional work",
        improvement_steps=["AI suggested a step"],
        suggested_followup="AI suggested an unnecessary question",
    )
    assert submission.why_not_verified is None
    assert submission.improvement_steps is None
    assert submission.followup_question is None


def test_passed_followup_preserves_original_question_and_answer():
    submission = SimpleNamespace(
        why_not_verified="Explanation was too short",
        improvement_steps="Provide edge cases",
        followup_question="How does concatenation allocate memory?",
        followup_answer="Strings are immutable, so a new value is produced.",
    )
    apply_review_explanations(
        submission,
        status="verified",
        why_not_verified="Stale AI failure reason",
        improvement_steps=["Unnecessary extra work"],
        suggested_followup="A completely different question",
        keep_answered_question=True,
    )
    assert submission.why_not_verified is None
    assert submission.improvement_steps is None
    assert submission.followup_question == "How does concatenation allocate memory?"
    assert submission.followup_answer == "Strings are immutable, so a new value is produced."


def test_unsuccessful_followup_keeps_correct_question_answer_pair():
    submission = SimpleNamespace(
        why_not_verified="Prior review",
        improvement_steps=None,
        followup_question="Explain string concatenation",
        followup_answer="My incomplete explanation",
    )
    apply_review_explanations(
        submission,
        status="needs_revision",
        why_not_verified="The answer does not cover memory allocations",
        improvement_steps=["Explain immutability", "Discuss allocations"],
        suggested_followup="New question that was never answered",
        keep_answered_question=True,
    )
    assert submission.followup_question == "Explain string concatenation"
    assert submission.followup_answer == "My incomplete explanation"
    assert submission.why_not_verified == "The answer does not cover memory allocations"
    assert submission.improvement_steps == "Explain immutability\nDiscuss allocations"


def test_first_failed_review_can_offer_a_followup():
    submission = SimpleNamespace(
        why_not_verified=None,
        improvement_steps=None,
        followup_question=None,
        followup_answer=None,
    )
    apply_review_explanations(
        submission,
        status="needs_revision",
        why_not_verified="Missing reasoning",
        improvement_steps=["Add concrete examples"],
        suggested_followup="Why are strings immutable?",
    )
    assert submission.followup_question == "Why are strings immutable?"
    assert submission.why_not_verified == "Missing reasoning"
    assert submission.improvement_steps == "Add concrete examples"
