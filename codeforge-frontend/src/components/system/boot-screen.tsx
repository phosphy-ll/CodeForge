"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

type BootScreenMode = "boot" | "today-plan";

type BootScreenProps = {
  onComplete?: () => void;
  mode?: BootScreenMode;
  autoComplete?: boolean;
};

const BOOT_STEPS = [
  {
    label: "Authenticating user",
    detail: "Access token accepted",
    duration: 420,
  },
  {
    label: "Loading active goal",
    detail: "Learning path detected",
    duration: 520,
  },
  {
    label: "Preparing dashboard",
    detail: "Progress data synced",
    duration: 620,
  },
  {
    label: "System ready",
    detail: "Workspace initialized",
    duration: 620,
  },
];

const TODAY_STEPS = [
  {
    label: "Reading your roadmap",
    detail: "Milestones and current progress detected",
    duration: 520,
  },
  {
    label: "Choosing today’s focus",
    detail: "CodeForge is selecting the most useful tasks",
    duration: 680,
  },
  {
    label: "Balancing difficulty",
    detail: "Plan adjusted for your current level",
    duration: 620,
  },
  {
    label: "Preparing daily plan",
    detail: "Your focused tasks are almost ready",
    duration: 720,
  },
];

export default function BootScreen({
  onComplete,
  mode = "boot",
  autoComplete = true,
}: BootScreenProps) {
  const steps = mode === "today-plan" ? TODAY_STEPS : BOOT_STEPS;

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  const progress = useMemo(() => {
    return Math.min(((completedSteps.length + 1) / steps.length) * 100, 100);
  }, [completedSteps.length, steps.length]);

  const copy = mode === "today-plan"
    ? {
        eyebrow: "Daily Plan",
        title: "Preparing today’s tasks",
        description:
          "CodeForge is turning your roadmap into a focused daily plan.",
        footer: "Your plan is loading. Stay on this page.",
      }
    : {
        eyebrow: "CodeForge Boot",
        title: "Initializing workspace",
        description: "Loading your account, goal, and progress data.",
        footer: "Preparing your workspace.",
      };

  useEffect(() => {
    const cursorTimer = window.setInterval(() => {
      setCursorVisible((value) => !value);
    }, 420);

    return () => window.clearInterval(cursorTimer);
  }, []);

  useEffect(() => {
    if (activeStep >= steps.length) {
      if (!autoComplete) return;

      const doneTimer = window.setTimeout(() => {
        onComplete?.();
      }, 450);

      return () => window.clearTimeout(doneTimer);
    }

    const timer = window.setTimeout(() => {
      setCompletedSteps((prev) =>
        prev.includes(activeStep) ? prev : [...prev, activeStep]
      );
      setActiveStep((prev) => prev + 1);
    }, steps[activeStep].duration);

    return () => window.clearTimeout(timer);
  }, [activeStep, autoComplete, onComplete, steps]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[var(--cf-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.20),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(60,242,255,0.08),transparent_30%)]" />

      <div className="relative w-full max-w-2xl px-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/30 bg-[var(--cf-card)] shadow-[0_0_34px_var(--cf-glow)]">
            {mode === "today-plan" ? (
              <Sparkles className="h-7 w-7 animate-pulse text-[var(--cf-accent)]" />
            ) : (
              <img
                src="/logo-dark.svg"
                alt="CodeForge"
                className="h-10 w-10 object-contain"
              />
            )}
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--cf-accent)]">
              {copy.eyebrow}
            </p>
            <h1 className="text-2xl font-black text-[var(--cf-text)]">
              {copy.title}
              <span className={cursorVisible ? "opacity-100" : "opacity-0"}>
                _
              </span>
            </h1>
            <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">
              {copy.description}
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
          <div className="space-y-3 font-mono text-sm">
            {steps.map((step, index) => {
              const done = completedSteps.includes(index);
              const active = index === activeStep;

              return (
                <div
                  key={step.label}
                  className={[
                    "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition-all duration-300",
                    done
                      ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-300"
                      : active
                        ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/10 text-[var(--cf-text)] shadow-[0_0_24px_var(--cf-glow)]"
                        : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-muted)]",
                  ].join(" ")}
                >
                  <div>
                    <p className="font-bold">
                      {done ? "[OK]" : active ? "[RUN]" : "[WAIT]"} {step.label}
                    </p>
                    <p className="mt-1 text-xs opacity-70">{step.detail}</p>
                  </div>

                  <span className="text-xs">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : active ? (
                      "running"
                    ) : (
                      "queued"
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--cf-text-muted)]">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--cf-primary)] shadow-[0_0_28px_var(--cf-glow)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="mt-5 text-center text-sm font-semibold text-[var(--cf-text-secondary)]">
            {copy.footer}
          </p>
        </div>
      </div>
    </div>
  );
}