"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Flame,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  Zap,
} from "lucide-react";

import LiquidGlassButton from "@/components/ui/liquid-glass-button";

export default function ExamsPage() {
  const router = useRouter();

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Exams
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
          Pressure checkpoints
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Prove skill under pressure. Quizzes test understanding. Exams test
          execution, reasoning, edge cases, and real proof.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative grid gap-5 xl:grid-cols-3">
          <Metric
            icon={<Zap className="h-5 w-5" />}
            label="Quiz"
            value="35 / 70 / 100 pts"
          />
          <Metric
            icon={<Flame className="h-5 w-5" />}
            label="Exam"
            value="165 pts"
          />
          <Metric
            icon={<Timer className="h-5 w-5" />}
            label="Streak"
            value="Both count"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ExamModeCard
          icon={<GraduationCap className="h-6 w-6" />}
          eyebrow="Understanding check"
          title="Quiz mode"
          description="Generate a focused quiz from your skill target, weak areas, and recent submissions. One question per screen, clean navigation, instant score."
          points="5 questions = 35 pts · 10 = 70 pts · 15 = 100 pts"
          rules={[
            "Affects streak",
            "No manual review",
            "Best attempt counts",
            "Retry depends on score",
          ]}
          buttonText="Start quiz"
          onClick={() => router.push("/exams/quiz")}
        />

        <ExamModeCard
          icon={<Target className="h-6 w-6" />}
          eyebrow="Execution proof"
          title="Exam mode"
          description="Generate a harder checkpoint task. Submit explanation and code proof. AI reviews score, suspicion, feedback, and follow-up question."
          points="Max reward: 165 pts"
          rules={[
            "Affects streak",
            "Manual review available",
            "Best attempt counts",
            "Harder than build task",
          ]}
          buttonText="Start exam"
          onClick={() => router.push("/exams/session")}
        />
      </section>

      <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]">
            <ShieldAlert className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-[var(--cf-text)]">
              How scoring works
            </h2>

            <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              You always earn points based on score percentage. A 60% exam gives
              60% of 165 points. Rejected only means 0%. Strong proof gets more
              points; weak proof still teaches you what to fix.
            </p>
          </div>
        </div>
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
  onClick,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  points: string;
  rules: string[];
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.22)] transition hover:border-[var(--cf-primary)]/35">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.16),transparent_35%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]">
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
              className="flex items-center gap-2 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-3 text-sm text-[var(--cf-text-secondary)]"
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

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
      <div className="flex items-center gap-3 text-[var(--cf-accent)]">
        {icon}
        <p className="text-sm font-black uppercase tracking-[0.18em]">
          {label}
        </p>
      </div>

      <p className="mt-3 text-2xl font-black text-[var(--cf-text)]">
        {value}
      </p>
    </div>
  );
}