"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, X } from "lucide-react";

const STORAGE_KEY = "codeforge_guided_tour_completed";

type TourStep = {
  route: string;
  target: string;
  title: string;
  text: string;
  cta: string;
  nextRoute?: string | null;
  validate?: () => boolean;
  beforeNext?: () => void;
};

function clickPageButton(text: string) {
  const buttons = Array.from(document.querySelectorAll("button"));
  const button = buttons.find((btn) =>
    btn.textContent?.toLowerCase().includes(text.toLowerCase())
  ) as HTMLButtonElement | undefined;

  if (button && !button.disabled) button.click();
}

function hasSelectedButton(target: string) {
  const root = document.querySelector(`[data-tour="${target}"]`);
  if (!root) return false;

  return Boolean(root.querySelector('button[aria-pressed="true"]'));
}

function hasGoalTitle() {
  const input = document.querySelector(
    '[data-tour="goal-title"] input'
  ) as HTMLInputElement | null;

  return Boolean(input?.value.trim() && input.value.trim().length >= 2);
}

const steps: TourStep[] = [
  {
    route: "/dashboard",
    target: "dashboard-main",
    title: "Start from your dashboard",
    text: "Dashboard is your control center. You will see progress, streak pressure, current goal and what needs attention.",
    cta: "Create first goal",
    nextRoute: "/goals/new",
  },
  {
    route: "/goals/new",
    target: "goal-title",
    title: "Name your goal",
    text: "Write the result you want. Description is optional.",
    cta: "Next",
    validate: hasGoalTitle,
  },
  {
    route: "/goals/new",
    target: "goal-type",
    title: "Choose goal type",
    text: "Pick the closest path. This helps CodeForge generate the right roadmap.",
    cta: "Next",
    validate: () => hasSelectedButton("goal-type"),
  },
  {
    route: "/goals/new",
    target: "goal-language",
    title: "Choose language",
    text: "Pick the programming language for this path.",
    cta: "Continue form",
    validate: () => hasSelectedButton("goal-language"),
    beforeNext: () => clickPageButton("Continue"),
  },
  {
    route: "/goals/new",
    target: "goal-level",
    title: "Set your level",
    text: "Choose your real current level. The roadmap difficulty depends on this.",
    cta: "Next",
    validate: () => hasSelectedButton("goal-level"),
  },
  {
    route: "/goals/new",
    target: "goal-learning-style",
    title: "Choose learning style",
    text: "Pick how CodeForge should teach you.",
    cta: "Next",
    validate: () => hasSelectedButton("goal-learning-style"),
  },
  {
    route: "/goals/new",
    target: "goal-accountability",
    title: "Choose accountability",
    text: "Pick how hard the system should push you.",
    cta: "Continue form",
    validate: () => hasSelectedButton("goal-accountability"),
    beforeNext: () => clickPageButton("Continue"),
  },
  {
    route: "/goals/new",
    target: "goal-timeline",
    title: "Set timeline",
    text: "Choose how many months you want. Shorter timelines mean stronger pressure.",
    cta: "Continue form",
    beforeNext: () => clickPageButton("Continue"),
  },
  {
    route: "/goals/new",
    target: "goal-confirm",
    title: "Forge roadmap",
    text: "Review everything, then press Forge my roadmap.",
    cta: "I forged it",
    beforeNext: () => clickPageButton("Forge my roadmap"),
    nextRoute: "/roadmap",
  },
  {
    route: "/roadmap",
    target: "roadmap-main",
    title: "Understand roadmap",
    text: "Roadmap is your long-term structure. Milestones keep learning organized.",
    cta: "Go to Today",
    nextRoute: "/today",
  },
  {
    route: "/today",
    target: "today-tasks",
    title: "Execute daily tasks",
    text: "Today is where execution happens. Start tasks, submit proof, get verified.",
    cta: "Finish tutorial",
  },
];

function getCardPosition(rect: DOMRect | null): React.CSSProperties {
  const width = Math.min(440, window.innerWidth - 32);
  const height = 230;
  const gap = 18;
  const padding = 16;

  if (!rect) {
    return {
      left: padding,
      bottom: padding,
      width,
    };
  }

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft = rect.left;

  let top = rect.bottom + gap;
  let left = rect.left;

  if (window.innerWidth < 768) {
    return {
      left: padding,
      bottom: padding,
      width,
    };
  }

  if (spaceRight >= width + gap) {
    top = rect.top;
    left = rect.right + gap;
  } else if (spaceLeft >= width + gap) {
    top = rect.top;
    left = rect.left - width - gap;
  } else if (spaceBelow >= height + gap) {
    top = rect.bottom + gap;
    left = rect.left;
  } else if (spaceAbove >= height + gap) {
    top = rect.top - height - gap;
    left = rect.left;
  } else {
    top = window.innerHeight - height - padding;
    left = window.innerWidth - width - padding;
  }

  top = Math.max(padding, Math.min(top, window.innerHeight - height - padding));
  left = Math.max(padding, Math.min(left, window.innerWidth - width - padding));

  return { top, left, width };
}

export default function GuidedTour() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hint, setHint] = useState("");

  const step = steps[stepIndex];
  const isGoalPage = pathname.startsWith("/goals/new");

  const isCorrectRoute = useMemo(() => {
    return pathname === step.route || pathname.startsWith(`${step.route}/`);
  }, [pathname, step.route]);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);

    if (!completed) {
      const timer = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!isCorrectRoute) router.replace(step.route);
  }, [open, isCorrectRoute, router, step.route]);

  useEffect(() => {
    function updateTarget() {
      if (!open || !isCorrectRoute) {
        setTargetRect(null);
        return;
      }

      const element = document.querySelector(
        `[data-tour="${step.target}"]`
      ) as HTMLElement | null;

      if (!element) {
        setTargetRect(null);
        return;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: step.target === "goal-title" ? "start" : "nearest",
        inline: "nearest",
      });

      if (step.target === "goal-title") {
        window.scrollBy({
          top: -70,
          behavior: "smooth",
        });
      }

      window.setTimeout(() => {
        setTargetRect(element.getBoundingClientRect());
      }, 340);
    }

    updateTarget();

    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [open, isCorrectRoute, step.target, pathname]);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  function skip() {
    const ok = window.confirm(
      "Tutorial is recommended for your first run. You can replay it later from Settings. Skip anyway?"
    );

    if (!ok) return;

    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    router.replace("/goals/new");
  }

  function next() {
    setHint("");

    if (step.validate && !step.validate()) {
      setHint("Complete the highlighted part first.");
      return;
    }

    step.beforeNext?.();

    const isLast = stepIndex === steps.length - 1;

    if (isLast) {
      finish();
      return;
    }

    const nextIndex = stepIndex + 1;
    const nextStep = steps[nextIndex];

    window.setTimeout(() => {
      setStepIndex(nextIndex);

      if (step.nextRoute) {
        router.replace(step.nextRoute);
        return;
      }

      if (nextStep.route !== pathname && !pathname.startsWith(nextStep.route)) {
        router.replace(nextStep.route);
      }
    }, step.beforeNext ? 750 : 0);
  }

  if (!open) return null;

  const hasSpotlight = Boolean(targetRect);
  const cardStyle = getCardPosition(targetRect);

  return (
    <div className="pointer-events-none fixed inset-0 z-[140]">
      <div
        className={[
          "absolute inset-0 transition-all duration-300",
          isGoalPage ? "bg-black/0" : "bg-black/18",
        ].join(" ")}
      />

      {hasSpotlight && targetRect ? (
        <div
          className={[
            "pointer-events-none absolute rounded-[28px] border transition-all duration-300",
            isGoalPage
              ? "border-[var(--cf-primary)]/95 shadow-[0_0_0_9999px_rgba(0,0,0,0.04),0_0_0_1px_rgba(139,92,246,0.75),0_0_40px_rgba(139,92,246,0.48),0_0_100px_rgba(139,92,246,0.38)]"
              : "border-[var(--cf-primary)]/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.18),0_0_0_1px_rgba(139,92,246,0.70),0_0_40px_rgba(139,92,246,0.42),0_0_100px_rgba(139,92,246,0.32)]",
          ].join(" ")}
          style={{
            top: Math.max(targetRect.top - 10, 12),
            left: Math.max(targetRect.left - 10, 12),
            width: targetRect.width + 20,
            height: targetRect.height + 20,
          }}
        />
      ) : null}

      <div className="fixed transition-all duration-300" style={cardStyle}>
        <div
          className="
            pointer-events-auto relative overflow-hidden rounded-[26px]
            border border-white/12
            bg-[rgba(18,18,28,0.58)]
            p-4 text-[var(--cf-text)]
            shadow-[0_18px_70px_rgba(0,0,0,0.55),0_0_42px_rgba(139,92,246,0.22)]
            backdrop-blur-2xl
            before:pointer-events-none before:absolute before:inset-0
            before:bg-[linear-gradient(135deg,rgba(255,255,255,0.20),rgba(255,255,255,0.04))]
            before:opacity-70
            after:pointer-events-none after:absolute after:-left-1/3 after:top-0
            after:h-full after:w-1/2 after:rotate-12
            after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]
            after:opacity-30
          "
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
                  Tutorial {stepIndex + 1}/{steps.length}
                </p>

                <h2 className="mt-2 text-xl font-black text-[var(--cf-text)]">
                  {step.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={skip}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--cf-text-muted)] backdrop-blur-xl transition hover:text-[var(--cf-text)]"
                aria-label="Skip tutorial"
              >
                <X size={17} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--cf-text-secondary)]">
              {step.text}
            </p>

            {hint ? (
              <p className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200">
                {hint}
              </p>
            ) : null}

            <div className="mt-4 flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={[
                    "h-2 flex-1 rounded-full transition",
                    index <= stepIndex
                      ? "bg-[var(--cf-primary)] shadow-[0_0_14px_rgba(139,92,246,0.45)]"
                      : "bg-black/35",
                  ].join(" ")}
                />
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={skip}
                className="flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-[var(--cf-text-secondary)] backdrop-blur-xl transition hover:text-[var(--cf-text)]"
              >
                Skip
              </button>

              <button
                type="button"
                onClick={next}
                className="
                  group relative flex-1 overflow-hidden rounded-2xl
                  border border-[var(--cf-primary)]/35
                  bg-[var(--cf-primary)]/16
                  px-4 py-3 text-sm font-black text-[var(--cf-accent)]
                  shadow-[0_12px_36px_rgba(139,92,246,0.20)]
                  backdrop-blur-xl transition-all duration-300
                  hover:border-[var(--cf-primary)]/55
                  hover:bg-[var(--cf-primary)]/22
                  active:scale-[0.985]
                  before:absolute before:inset-0
                  before:bg-[linear-gradient(135deg,rgba(255,255,255,0.20),rgba(255,255,255,0.04))]
                  before:opacity-60
                  after:absolute after:-left-1/3 after:top-0
                  after:h-full after:w-1/2 after:rotate-12
                  after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)]
                  after:opacity-0 after:transition-all after:duration-500
                  hover:after:left-[120%] hover:after:opacity-100
                "
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  {stepIndex === steps.length - 1 ? (
                    <>
                      Finish <CheckCircle2 className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      {step.cta} <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}