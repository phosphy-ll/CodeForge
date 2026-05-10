"use client";

import { useEffect, useMemo, useState } from "react";

type BootScreenProps = {
  onComplete: () => void;
};

const STEPS = [
  {
    label: "Authenticating user",
    detail: "Access token accepted",
    duration: 420,
  },
  {
    label: "Loading active goal",
    detail: "Execution target detected",
    duration: 520,
  },
  {
    label: "Generating daily execution plan",
    detail: "Tasks locked to today",
    duration: 680,
  },
  {
    label: "Syncing AI Coach",
    detail: "Risk profile updated",
    duration: 560,
  },
  {
    label: "System ready",
    detail: "No idle state allowed",
    duration: 700,
  },
];

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  const progress = useMemo(() => {
    return Math.min(((completedSteps.length + 1) / STEPS.length) * 100, 100);
  }, [completedSteps.length]);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setCursorVisible((value) => !value);
    }, 420);

    return () => clearInterval(cursorTimer);
  }, []);

  useEffect(() => {
    if (activeStep >= STEPS.length) {
      const doneTimer = setTimeout(() => {
        onComplete();
      }, 500);

      return () => clearTimeout(doneTimer);
    }

    const timer = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, activeStep]);
      setActiveStep((prev) => prev + 1);
    }, STEPS[activeStep].duration);

    return () => clearTimeout(timer);
  }, [activeStep, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[var(--cf-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(60,242,255,0.08),transparent_30%)]" />

      <div className="relative w-full max-w-2xl px-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/30 bg-[var(--cf-card)] shadow-[0_0_34px_var(--cf-glow)]">
            <img
              src="/logo-dark.svg"
              alt="CodeForge"
              className="h-10 w-10 object-contain"
            />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--cf-accent)]">
              CodeForge Boot
            </p>
            <h1 className="text-2xl font-black text-[var(--cf-text)]">
              Initializing execution system
              <span className={cursorVisible ? "opacity-100" : "opacity-0"}>
                _
              </span>
            </h1>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
          <div className="space-y-3 font-mono text-sm">
            {STEPS.map((step, index) => {
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
                    {done ? "verified" : active ? "running" : "queued"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--cf-text-muted)]">
              <span>System progress</span>
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
            Execution plan loading. No progress is counted without proof.
          </p>
        </div>
      </div>
    </div>
  );
}