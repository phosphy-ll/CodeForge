# Strategy-Based Task Verification

Academic software engineering enhancement for CodeForge (snapshot: 2026-10-15).

## Baseline

CodeForge already has \`SubmissionService\`, \`AIReviewService\`, \`TaskSubmission\`, code/text/link proof and the privileged manual review API.

## New architecture

- \`app/verification/strategy.py\`: \`VerificationStrategy\` Protocol and \`VerificationService\` context.
- Concrete strategies: AI review, manual review request, public GitHub commit evidence, successful public GitHub Actions run evidence.
- \`app/api/v1/verification.py\`: authenticated \`POST /api/v1/verification/check-evidence\`.
- \`SubmissionService\` now calls a compatibility adapter so its existing AI scoring contract remains unchanged.
- No new database migration.

**Evidence is not a task grade**. A found commit or successful CI run returns evidence information; the endpoint always returns \`task_verified: false\`. The existing review/scoring workflow remains the only source of verified points.

## Tests

Run from CodeForge repository root:

\`\`\`powershell
python -m pip install -r requirements.txt
python -m pytest -q tests/test_verification_strategy.py
\`\`\`

The isolated module tests were run in a separate environment on 2026-10-15: 15 passed. Full CodeForge integration tests and Railway deployment are pending.

## Example API payloads

\`\`\`json
{"strategy":"github","submission_link":"https://github.com/OWNER/REPO/commit/abcdef1"}
\`\`\`

\`\`\`json
{"strategy":"automated_tests","submission_link":"https://github.com/OWNER/REPO/commit/abcdef1","workflow_run_id":123456}
\`\`\`

The evidence route requires Bearer authentication. Real GitHub metadata is queried through \`api.github.com\`, not through user-controlled hosts. URL parsing is strict, redirects are disabled, timeouts and response size are bounded. The design never executes user-submitted code on the backend.

## Limitations

- Public GitHub repository evidence only.
- GitHub API throttling; add production per-user rate limiting and monitoring before deploying this new API broadly.
- GitHub commits and CI success do not prove the author's understanding or the actual task requirements.
- The \`manual\` strategy signals that a human review is needed; the existing authorized manual-review endpoint performs the actual decision.
- The academic 10-week development timeline is a forward-looking plan, not a historical claim.

## References

- https://refactoring.guru/design-patterns/strategy
- https://fastapi.tiangolo.com/tutorial/bigger-applications/
- https://docs.github.com/en/rest/git/commits
- https://docs.github.com/en/rest/actions/workflow-runs
- https://docs.pytest.org/en/stable/
- https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
