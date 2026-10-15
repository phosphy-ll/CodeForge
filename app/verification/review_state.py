"""Consistent display fields for AI-reviewed CodeForge submissions."""


def apply_review_explanations(
    submission,
    *,
    status: str,
    why_not_verified: str | None,
    improvement_steps: list[str] | str | None,
    suggested_followup: str | None,
    keep_answered_question: bool = False,
) -> None:
    """Apply review explanations without mismatching a question and its answer.

    The AI may return an additional question even when a task passes. A new
    question must not replace the one the user already answered.
    """
    if status == "verified":
        submission.why_not_verified = None
        submission.improvement_steps = None
    else:
        submission.why_not_verified = why_not_verified
        if isinstance(improvement_steps, list):
            submission.improvement_steps = "\n".join(improvement_steps) or None
        else:
            submission.improvement_steps = improvement_steps or None

    if keep_answered_question and submission.followup_answer:
        # Preserve the historic question paired with the stored answer.
        return

    submission.followup_question = None if status == "verified" else suggested_followup
