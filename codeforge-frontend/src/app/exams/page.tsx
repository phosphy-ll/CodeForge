"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Flame,
  GraduationCap,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";

import LiquidGlassButton from "@/components/ui/liquid-glass-button";

export default function ExamsPage() {
  const router = useRouter();

  return (
    <main className="space-y-6 md:space-y-8">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Exams
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)] md:text-5xl">
          Pressure checkpoints
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cf-text-secondary)]">
          Test understanding, prove execution, and turn real skill into verified
          progress.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[linear-gradient(135deg,rgba(17,17,26,0.98),rgba(32,22,58,0.82),rgba(8,8,13,0.98))] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.30)] md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.08),transparent_28%)]" />
        <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.75)]" />

        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <BadgeSoft text="Proof-based scoring" />
              <BadgeSoft text="Streak impact" tone="amber" />
              <BadgeSoft text="Manual review on exams" tone="green" />
            </div>

            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-[var(--cf-text)] md:text-6xl">
              Do not guess. Prove it.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)] md:text-base">
              Quizzes check if the concept is alive in your head. Exams check if
              you can actually execute under pressure.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <LiquidGlassButton onClick={() => router.push("/exams/session")}>
                Start exam
                <ArrowRight className="ml-2 h-4 w-4" />
              </LiquidGlassButton>

              <button
                type="button"
                onClick={() => router.push("/exams/quiz")}
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)]"
              >
                Start quiz
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-accent)]">
                  Max exam reward
                </p>

                <p className="mt-3 text-5xl font-black text-[var(--cf-text)]">
                  165
                </p>

                <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">
                  points based on score percentage
                </p>
              </div>

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 shadow-[0_0_40px_rgba(124,92,255,0.22)]">
                <Trophy className="h-10 w-10 text-[var(--cf-accent)]" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <MiniMetric label="Quiz" value="35–100" />
              <MiniMetric label="Exam" value="165" />
              <MiniMetric label="Streak" value="Yes" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <ExamModeCard
          icon={<GraduationCap className="h-6 w-6" />}
          eyebrow="Understanding check"
          title="Quiz mode"
          description="Fast checkpoint for concepts, syntax, and weak areas. Best when you want to test if you actually understand the topic before touching heavier proof."
          points="5 questions = 35 pts · 10 = 70 pts · 15 = 100 pts"
          tone="default"
          rules={[
            "One question per screen",
            "Best attempt counts",
            "No manual review",
            "Good before exam mode",
          ]}
          buttonText="Start quiz"
          onClick={() => router.push("/exams/quiz")}
        />

        <ExamModeCard
          icon={<Target className="h-6 w-6" />}
          eyebrow="Execution proof"
          title="Exam mode"
          description="Harder checkpoint with code, explanation, edge cases, and review. This is where CodeForge checks whether you can produce proof, not just answers."
          points="Max reward: 165 pts"
          tone="strong"
          rules={[
            "Requires real proof",
            "Manual review available",
            "Suspicion score included",
            "Affects streak progress",
          ]}
          buttonText="Start exam"
          onClick={() => router.push("/exams/session")}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.16)] md:p-7">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-[var(--cf-accent)]" />
            <h2 className="text-2xl font-black text-[var(--cf-text)]">
              Scoring rules
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            <StatusRow
              icon={<Flame className="h-4 w-4" />}
              label="Score-based points"
              value="60% exam = 60% of 165"
            />

            <StatusRow
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="Rejected proof"
              value="0 points, feedback still returned"
            />

            <StatusRow
              icon={<Timer className="h-4 w-4" />}
              label="Streak impact"
              value="Verified points count toward daily pressure"
            />

            <StatusRow
              icon={<LockKeyhole className="h-4 w-4" />}
              label="Anti-fake progress"
              value="Weak proof can trigger follow-up pressure"
            />
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-primary)]/25 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(17,17,26,0.96))] p-6 shadow-[0_0_32px_var(--cf-glow)] md:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.24),transparent_36%)]" />

          <div className="relative">
            <Sparkles className="h-7 w-7 text-[var(--cf-accent)]" />

            <h2 className="mt-4 text-2xl font-black text-[var(--cf-text)]">
              Recommended flow
            </h2>

            <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
              Quiz first when the topic is fresh. Exam after you can explain the
              concept and write working code without copying.
            </p>

            <div className="mt-6 grid gap-3">
              <FlowStep number="01" title="Quiz" text="Check understanding." />
              <FlowStep number="02" title="Exam" text="Submit execution proof." />
              <FlowStep number="03" title="Review" text="Fix weak points." />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function ExamModeCard({
  icon,
  eyebrow,
  title,
  description,
  points,
  rules,
  buttonText,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  points: string;
  rules: string[];
  buttonText: string;
  tone: "default" | "strong";
  onClick: () => void;
}) {
  const strong = tone === "strong";

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[38px] border p-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 md:p-7",
        strong
          ? "border-[var(--cf-primary)]/35 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(17,17,26,0.96))]"
          : "border-[var(--cf-border)] bg-[var(--cf-card)] hover:border-[var(--cf-primary)]/35",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.16),transparent_35%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div
          className={[
            "flex h-14 w-14 items-center justify-center rounded-2xl border text-[var(--cf-accent)]",
            strong
              ? "border-[var(--cf-primary)]/35 bg-[var(--cf-primary)]/14 shadow-[0_0_28px_var(--cf-glow)]"
              : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10",
          ].join(" ")}
        >
          {icon}
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-accent)]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--cf-text)]">
          {title}
        </h2>

        <p className="mt-4 text-sm leading-7 text-[var(--cf-text-secondary)]">
          {description}
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--cf-primary)]/20 bg-[var(--cf-primary)]/10 p-4 text-sm font-black text-[var(--cf-accent)]">
          {points}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {rules.map((rule) => (
            <div
              key={rule}
              className="flex items-center gap-2 rounded-2xl border border-[var(--cf-border)] bg-black/18 p-3 text-sm text-[var(--cf-text-secondary)]"
            >
              <CheckCircle2 className="h-4 w-4 text-[var(--cf-accent)]" />
              {rule}
            </div>
          ))}
        </div>

        <div className="mt-7">
          <LiquidGlassButton onClick={onClick}>
            {buttonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
      <p className="text-[11px] text-[var(--cf-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
      <div className="flex items-center gap-3">
        <div className="text-[var(--cf-accent)]">{icon}</div>
        <p className="text-sm font-bold text-[var(--cf-text-secondary)]">
          {label}
        </p>
      </div>

      <p className="text-right text-sm font-black text-[var(--cf-text)]">
        {value}
      </p>
    </div>
  );
}

function FlowStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-xs font-black text-[var(--cf-accent)]">
        {number}
      </div>

      <div>
        <p className="font-black text-[var(--cf-text)]">{title}</p>
        <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">{text}</p>
      </div>
    </div>
  );
}

function BadgeSoft({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "green" | "amber" | "rose";
}) {
  const cls =
    tone === "green"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : tone === "amber"
      ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
      : tone === "rose"
      ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
      : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]";

  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
        cls,
      ].join(" ")}
    >
      {text}
    </span>
  );
}