"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Code2,
  FileText,
  ShieldAlert,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type PracticeResult = {
  mode: string;
  score: number;
  feedback: string | null;
  suspicion_score: number;
  followup_question: string | null;
  earned_points: number;
  potential_reward_points: number;
  affects_streak: boolean;
  task_title: string;
};

export default function PracticeSessionPage() {
  const router = useRouter();
  const params = useSearchParams();

  const skill = params.get("skill") || "general";
  const actionType = params.get("type") || "practice";

  const [contentText, setContentText] = useState("");
  const [contentCode, setContentCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PracticeResult | null>(null);

  const title = useMemo(() => {
    return `${format(actionType)} drill: ${format(skill)}`;
  }, [skill, actionType]);

  async function submitDrill() {
    if (!contentText.trim() && !contentCode.trim()) {
      setError("Submit explanation, code, or both.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setResult(null);

      const response = await api.post(
        `/practice/drill?skill_name=${encodeURIComponent(
          skill
        )}&action_type=${encodeURIComponent(actionType)}`,
        {
          content_text: contentText.trim() || null,
          content_code: contentCode.trim() || null,
        }
      );

      setResult(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit practice drill.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <button
            onClick={() => router.push("/practice")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--cf-text-muted)] transition hover:text-[var(--cf-accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Practice
          </button>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            Practice session
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
            {title}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            This does not affect streak. It is pure training: submit proof, get
            reviewed, fix your weak execution pattern.
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-5">
          <p className="text-xs text-[var(--cf-text-muted)]">Mode</p>
          <p className="mt-1 text-xl font-black text-[var(--cf-text)]">
            {format(actionType)}
          </p>
        </div>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-5">
            <InfoCard
              icon={<Target className="h-5 w-5" />}
              title="Objective"
              text={`Train ${format(
                skill
              )} with real proof. Do not submit vague text.`}
            />

            <InfoCard
              icon={<Brain className="h-5 w-5" />}
              title="What to prove"
              text="Explain what you built or solved, why it works, and where it could fail."
            />

            <InfoCard
              icon={<ShieldAlert className="h-5 w-5" />}
              title="Review rule"
              text="Practice gives feedback only. It does not award streak points."
            />
          </aside>

          <section className="space-y-5">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[var(--cf-accent)]" />
                <h2 className="text-xl font-black text-[var(--cf-text)]">
                  Explanation
                </h2>
              </div>

              <textarea
                value={contentText}
                onChange={(event) => setContentText(event.target.value)}
                rows={8}
                placeholder="Explain what you did, why it works, and what edge cases matter..."
                className="mt-4 w-full resize-none rounded-[24px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-sm leading-7 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
              />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-[var(--cf-accent)]" />
                <h2 className="text-xl font-black text-[var(--cf-text)]">
                  Code proof
                </h2>
              </div>

              <textarea
                value={contentCode}
                onChange={(event) => setContentCode(event.target.value)}
                rows={10}
                placeholder="Paste your code proof here..."
                className="mt-4 w-full resize-none rounded-[24px] border border-[var(--cf-border)] bg-black/25 px-5 py-4 font-mono text-sm leading-7 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--cf-text-muted)]">
                Weak proof gets low score. Practice is for fixing, not faking.
              </p>

              <LiquidGlassButton onClick={submitDrill} disabled={submitting}>
                {submitting ? "Reviewing..." : "Submit drill"}
                <Zap className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            </div>
          </section>
        </div>
      </section>

      {result ? <ResultPanel result={result} /> : null}
    </main>
  );
}

function ResultPanel({ result }: { result: PracticeResult }) {
  const passed = result.score >= 70;

  return (
    <section
      className={[
        "relative overflow-hidden rounded-[36px] border p-7 shadow-[0_20px_70px_rgba(0,0,0,0.22)]",
        passed
          ? "border-emerald-500/25 bg-emerald-500/10"
          : "border-amber-500/25 bg-amber-500/10",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_35%)]" />

      <div className="relative grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--cf-text)]">
            {passed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            Practice review
          </div>

          <p className="mt-6 text-6xl font-black text-[var(--cf-text)]">
            {result.score}%
          </p>

          <p className="mt-3 text-sm text-[var(--cf-text-secondary)]">
            Suspicion: {result.suspicion_score} • Streak:{" "}
            {result.affects_streak ? "Affected" : "Not affected"}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-black text-[var(--cf-text)]">
            {passed ? "Solid practice result" : "Weak proof detected"}
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--cf-text-secondary)]">
            {result.feedback || "No feedback returned."}
          </p>

          {result.followup_question ? (
            <div className="mt-5 rounded-2xl border border-[var(--cf-border)] bg-black/10 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--cf-accent)]" />
                <p className="text-sm font-black text-[var(--cf-text)]">
                  Follow-up question
                </p>
              </div>

              <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
                {result.followup_question}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
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

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {text}
    </div>
  );
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}