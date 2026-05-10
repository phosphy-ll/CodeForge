"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  Code2,
  FileText,
  Flame,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";

import { api } from "@/lib/api";
import { getSelectedGoalId } from "@/lib/selected-goal";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type ExamGenerateResponse = {
  title: string;
  skill_name: string;
  max_points: number;
  time_limit_minutes: number;
  task_title: string;
  task_description: string;
  expected_proof: string[];
};

type AttemptSubmitResponse = {
  attempt: {
    id: number;
    score: number | null;
    earned_points: number;
    max_points: number;
    status: string;
    feedback: string | null;
    suspicion_score: number | null;
    followup_question: string | null;
    manual_review_requested: boolean;
  };
  best_attempt: {
    score: number | null;
    earned_points: number;
    status: string;
  } | null;
  attempts_used: number;
  attempts_allowed: number;
  can_retry: boolean;
};

const DIFFICULTIES = [2, 3, 4];

export default function ExamSessionPage() {
  const router = useRouter();

  const [skillName, setSkillName] = useState("");
  const [language, setLanguage] = useState("");
  const [difficulty, setDifficulty] = useState(3);

  const [exam, setExam] = useState<ExamGenerateResponse | null>(null);
  const [contentText, setContentText] = useState("");
  const [contentCode, setContentCode] = useState("");

  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [manualReviewLoading, setManualReviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AttemptSubmitResponse | null>(null);

  async function generateExam() {
    const goalId = getSelectedGoalId();

    if (!goalId) {
      setError("Select a goal first.");
      return;
    }

    if (skillName.trim().length < 2) {
      setError("Enter a skill name.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setResult(null);

      const response = await api.post<ExamGenerateResponse>("/exams/generate", {
        goal_id: goalId,
        skill_name: skillName.trim(),
        language: language.trim() || null,
        difficulty,
      });

      setExam(response.data);
      setContentText("");
      setContentCode("");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to generate exam.");
    } finally {
      setGenerating(false);
    }
  }

  async function submitExam() {
    const goalId = getSelectedGoalId();

    if (!goalId || !exam) return;

    if (!contentText.trim() && !contentCode.trim()) {
      setError("Submit explanation, code, or both.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post<AttemptSubmitResponse>("/exams/submit", {
        goal_id: goalId,
        skill_name: exam.skill_name,
        content_text: contentText.trim() || null,
        content_code: contentCode.trim() || null,
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit exam.");
    } finally {
      setSubmitting(false);
    }
  }

  async function requestManualReview() {
    if (!result?.attempt.id) return;

    try {
      setManualReviewLoading(true);
      setError("");

      await api.post(`/exams/${result.attempt.id}/request-manual-review`);

      setResult((prev) =>
        prev
          ? {
              ...prev,
              attempt: {
                ...prev.attempt,
                manual_review_requested: true,
              },
            }
          : prev
      );
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to request manual review.");
    } finally {
      setManualReviewLoading(false);
    }
  }

  return (
    <main className="space-y-8">
      <header>
        <button
          onClick={() => router.push("/exams")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--cf-text-muted)] transition hover:text-[var(--cf-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </button>

        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Exam session
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
          Execution checkpoint
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Generate a focused exam, submit proof, and earn points based on your
          score. Exam attempts affect streak.
        </p>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative grid gap-7 xl:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-5">
            <InfoCard
              icon={<Target className="h-5 w-5" />}
              title="Exam pressure"
              text="Exams are harder than build tasks. You need code or concrete technical proof, not vague theory."
            />

            <InfoCard
              icon={<Flame className="h-5 w-5" />}
              title="Reward"
              text="Max reward is 165 points. You earn points based on score percentage."
            />

            <InfoCard
              icon={<ShieldAlert className="h-5 w-5" />}
              title="Manual review"
              text="If the automatic review feels wrong, you can request manual review after submitting."
            />
          </aside>

          <section className="space-y-6">
            <div>
              <Label>Skill name</Label>
              <input
                value={skillName}
                onChange={(event) => setSkillName(event.target.value)}
                placeholder="Example: strings, functions, FastAPI routing..."
                className="mt-3 w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
              />
            </div>

            <div>
              <Label>Language / stack</Label>
              <input
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                placeholder="Optional: Python, Java, TypeScript..."
                className="mt-3 w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
              />
            </div>

            <div>
              <Label>Difficulty</Label>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {DIFFICULTIES.map((item) => {
                  const active = difficulty === item;

                  return (
                    <button
                      key={item}
                      onClick={() => setDifficulty(item)}
                      className={[
                        "rounded-3xl border p-5 text-left transition-all duration-300",
                        active
                          ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/12 text-[var(--cf-text)] shadow-[0_0_30px_var(--cf-glow)]"
                          : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/30",
                      ].join(" ")}
                    >
                      <p className="text-2xl font-black">{item}/5</p>
                      <p className="mt-1 text-sm text-[var(--cf-text-muted)]">
                        {item === 2 ? "Focused" : item === 3 ? "Standard" : "Hard"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <LiquidGlassButton
              onClick={generateExam}
              disabled={generating}
              className="min-w-[220px] justify-center"
            >
              {generating ? "Generating..." : "Generate exam"}
              <Sparkles className="ml-2 h-4 w-4" />
            </LiquidGlassButton>
          </section>
        </div>
      </section>

      {exam ? (
        <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.16),transparent_35%)]" />

          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--cf-accent)]">
                  {exam.title}
                </p>

                <h2 className="mt-3 text-3xl font-black text-[var(--cf-text)]">
                  {exam.task_title}
                </h2>

                <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--cf-text-secondary)]">
                  {exam.task_description}
                </p>
              </div>

              <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
                <p className="text-xs text-[var(--cf-text-muted)]">Max reward</p>
                <p className="mt-1 text-2xl font-black text-[var(--cf-text)]">
                  {exam.max_points} pts
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {exam.expected_proof.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-sm text-[var(--cf-text-secondary)]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[var(--cf-accent)]" />
                  <Label>Explanation proof</Label>
                </div>

                <textarea
                  value={contentText}
                  onChange={(event) => setContentText(event.target.value)}
                  rows={10}
                  placeholder="Explain what you built, why it works, edge cases, and improvements..."
                  className="mt-3 w-full resize-none rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-sm leading-7 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(124,92,255,0.35)] hover:scrollbar-thumb-[rgba(167,139,250,0.55)]"
                />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <Code2 className="h-5 w-5 text-[var(--cf-accent)]" />
                  <Label>Code proof</Label>
                </div>

                <textarea
                  value={contentCode}
                  onChange={(event) => setContentCode(event.target.value)}
                  rows={10}
                  placeholder="Paste your code here..."
                  className="mt-3 w-full resize-none rounded-2xl border border-[var(--cf-border)] bg-black/25 px-5 py-4 font-mono text-sm leading-7 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(124,92,255,0.35)] hover:scrollbar-thumb-[rgba(167,139,250,0.55)]"
                />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--cf-border)] pt-6">
              <p className="text-sm text-[var(--cf-text-muted)]">
                Weak proof still earns partial points, but lower score means
                lower momentum.
              </p>

              <LiquidGlassButton onClick={submitExam} disabled={submitting}>
                {submitting ? "Reviewing..." : "Submit exam"}
                <Flame className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            </div>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.2),transparent_35%)]" />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--cf-accent)]">
                  Exam result
                </p>

                <h2 className="mt-3 text-5xl font-black text-[var(--cf-text)]">
                  {result.attempt.score ?? 0}%
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {result.can_retry ? (
                  <LiquidGlassButton
                    onClick={() => {
                      setResult(null);
                      setContentText("");
                      setContentCode("");
                    }}
                  >
                    Retry exam
                    <RotateCcw className="ml-2 h-4 w-4" />
                  </LiquidGlassButton>
                ) : null}

                <button
                  onClick={requestManualReview}
                  disabled={
                    manualReviewLoading ||
                    result.attempt.manual_review_requested
                  }
                  className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-6 py-4 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-text)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {result.attempt.manual_review_requested
                    ? "Manual review requested"
                    : manualReviewLoading
                    ? "Requesting..."
                    : "Request manual review"}
                </button>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-4">
              <ResultCard
                label="Earned"
                value={`${result.attempt.earned_points}/${result.attempt.max_points}`}
              />
              <ResultCard label="Status" value={result.attempt.status} />
              <ResultCard
                label="Suspicion"
                value={`${result.attempt.suspicion_score ?? 0}`}
              />
              <ResultCard
                label="Attempts"
                value={`${result.attempts_used}/${result.attempts_allowed}`}
              />
            </div>

            <div className="mt-7 rounded-3xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
              <p className="text-sm leading-7 text-[var(--cf-text-secondary)] whitespace-pre-wrap">
                {result.attempt.feedback || "No feedback returned."}
              </p>
            </div>

            {result.attempt.followup_question ? (
              <div className="mt-5 rounded-3xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 p-5">
                <div className="flex items-center gap-3 text-[var(--cf-accent)]">
                  <Brain className="h-5 w-5" />
                  <p className="text-sm font-black uppercase tracking-[0.18em]">
                    Follow-up question
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
                  {result.attempt.followup_question}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]">
          {icon}
        </div>
        <h3 className="font-black text-[var(--cf-text)]">{title}</h3>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--cf-text-secondary)]">
        {text}
      </p>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--cf-text-muted)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--cf-text-secondary)]">
      {children}
    </p>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {text}
    </div>
  );
}