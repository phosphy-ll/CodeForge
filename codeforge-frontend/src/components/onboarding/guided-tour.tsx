"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "codeforge_guided_tour_completed";
const FORCE_OPEN_EVENT = "codeforge:open-guided-tour";

type GuidedTourProps = {
  hasActiveGoal?: boolean;
};

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

function isMobileScreen() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

function clickPageButton(...texts: string[]) {
  const buttons = Array.from(document.querySelectorAll("button"));

  const button = buttons.find((btn) => {
    const content = btn.textContent?.toLowerCase() || "";
    return texts.some((text) => content.includes(text.toLowerCase()));
  }) as HTMLButtonElement | undefined;

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
    title: "Welcome to your workspace",
    text: "This is your main dashboard. Later you will see your goal, progress, streak, and what needs attention.",
    cta: "Create first goal",
    nextRoute: "/goals/new",
  },
  {
    route: "/goals/new",
    target: "goal-title",
    title: "Name your goal",
    text: "Write the result you want to reach. Keep it simple — you can add more context later.",
    cta: "Next",
    validate: hasGoalTitle,
  },
  {
    route: "/goals/new",
    target: "goal-type",
    title: "Choose your path",
    text: "Pick the option that best matches what you want CodeForge to help you build toward.",
    cta: "Next",
    validate: () => hasSelectedButton("goal-type"),
  },
  {
    route: "/goals/new",
    target: "goal-language",
    title: "Choose your language",
    text: "Select the language or stack you want this roadmap to focus on.",
    cta: "Continue",
    validate: () => hasSelectedButton("goal-language"),
    beforeNext: () => clickPageButton("Continue"),
  },
  {
    route: "/goals/new",
    target: "goal-level",
    title: "Set your current level",
    text: "Choose the level that feels closest to where you are now. This helps CodeForge tune the roadmap difficulty.",
    cta: "Next",
    validate: () => hasSelectedButton("goal-level"),
  },
  {
    route: "/goals/new",
    target: "goal-learning-style",
    title: "Pick your learning style",
    text: "Tell CodeForge how you prefer to learn: more theory, more practice, balanced, or project-based.",
    cta: "Next",
    validate: () => hasSelectedButton("goal-learning-style"),
  },
  {
    route: "/goals/new",
    target: "goal-accountability",
    title: "Choose your pace",
    text: "Pick how much structure you want. You can keep it flexible or choose a more focused rhythm.",
    cta: "Continue",
    validate: () => hasSelectedButton("goal-accountability"),
    beforeNext: () => clickPageButton("Continue"),
  },
  {
    route: "/goals/new",
    target: "goal-timeline",
    title: "Choose your timeline",
    text: "Pick a realistic timeframe. Shorter timelines need more weekly consistency.",
    cta: "Continue",
    beforeNext: () => clickPageButton("Continue"),
  },
  {
    route: "/goals/new",
    target: "goal-confirm",
    title: "Review your setup",
    text: "Check the details. After this, CodeForge will generate your personalized roadmap.",
    cta: "Generate roadmap",
    beforeNext: () =>
      clickPageButton("Generate my roadmap", "Create roadmap", "Forge my roadmap"),
    nextRoute: "/roadmap",
  },
  {
    route: "/roadmap",
    target: "roadmap-main",
    title: "Your roadmap is ready",
    text: "This is your long-term structure. Milestones keep your learning organized and easier to follow.",
    cta: "Prepare today",
    nextRoute: "/today",
  },
  {
    route: "/today",
    target: "today-tasks",
    title: "Start today’s plan",
    text: "This is where daily progress happens. Open a task, complete it, and submit your work when ready.",
    cta: "Finish",
  },
];

function getCardPosition(rect: DOMRect | null): React.CSSProperties {
  const padding = 16;
  const gap = 18;
  const width = Math.min(440, window.innerWidth - 32);
  const height = 230;

  if (isMobileScreen()) {
    return {
      left: 16,
      right: 16,
      bottom: 86,
      width: "auto",
    };
  }

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

export default function GuidedTour({ hasActiveGoal = false }: GuidedTourProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hint, setHint] = useState("");
  const [preparingToday, setPreparingToday] = useState(false);

  const step = steps[stepIndex];
  const isGoalPage = pathname.startsWith("/goals/new");

  const isCorrectRoute = useMemo(() => {
    return pathname === step.route || pathname.startsWith(`${step.route}/`);
  }, [pathname, step.route]);

  useEffect(() => {
    function forceOpenTour() {
      localStorage.removeItem(STORAGE_KEY);
      setStepIndex(0);
      setHint("");
      setOpen(true);
    }

    window.addEventListener(FORCE_OPEN_EVENT, forceOpenTour);

    return () => {
      window.removeEventListener(FORCE_OPEN_EVENT, forceOpenTour);
    };
  }, []);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);

    if (!hasActiveGoal) {
      localStorage.removeItem(STORAGE_KEY);

      const timer = window.setTimeout(() => {
        setStepIndex(0);
        setHint("");
        setOpen(true);
      }, 1100);

      return () => window.clearTimeout(timer);
    }

    if (!completed) {
      const timer = window.setTimeout(() => {
        setStepIndex(0);
        setHint("");
        setOpen(true);
      }, 1100);

      return () => window.clearTimeout(timer);
    }
  }, [hasActiveGoal]);

  useEffect(() => {
    if (!open) return;
    if (!isCorrectRoute) router.replace(step.route);
  }, [open, isCorrectRoute, router, step.route]);

  useEffect(() => {
    let scrollTimer: number | null = null;

    function getElement() {
      return document.querySelector(
        `[data-tour="${step.target}"]`
      ) as HTMLElement | null;
    }

    function updateRectOnly() {
      const element = getElement();

      if (!open || !isCorrectRoute || !element) {
        setTargetRect(null);
        return;
      }

      setTargetRect(element.getBoundingClientRect());
    }

    function scrollToTargetOnce() {
      const element = getElement();

      if (!open || !isCorrectRoute || !element) {
        setTargetRect(null);
        return;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: isMobileScreen() ? "center" : "nearest",
        inline: "nearest",
      });

      window.setTimeout(updateRectOnly, 420);
    }

    scrollToTargetOnce();

    function handleScrollOrResize() {
      if (scrollTimer) window.clearTimeout(scrollTimer);

      scrollTimer = window.setTimeout(() => {
        updateRectOnly();
      }, 16);
    }

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);

      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [open, isCorrectRoute, step.target, pathname]);

  function finish() {
    if (!hasActiveGoal) {
      setHint("Create your first goal first. Then this setup guide will be completed.");
      router.replace("/goals/new");
      return;
    }

    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  function skip() {
    const ok = window.confirm(
      hasActiveGoal
        ? "Skip the quick setup guide? You can replay it later from Settings."
        : "You need a goal before CodeForge can generate your roadmap. Go to goal creation?"
    );

    if (!ok) return;

    if (hasActiveGoal) {
      localStorage.setItem(STORAGE_KEY, "true");
      setOpen(false);
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
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

    if (step.target === "roadmap-main") {
      setPreparingToday(true);

      window.setTimeout(() => {
        setPreparingToday(false);
        setStepIndex(nextIndex);
        router.replace("/today");
      }, 1800);

      return;
    }

    window.setTimeout(() => {
      setStepIndex(nextIndex);

      if (step.nextRoute) {
        router.replace(step.nextRoute);
        return;
      }

      if (nextStep.route !== pathname && !pathname.startsWith(nextStep.route)) {
        router.replace(nextStep.route);
      }
    }, step.beforeNext ? 850 : 0);
  }

  if (!open) return null;

  if (preparingToday) {
    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#050509]/92 px-4 backdrop-blur-2xl">
        <div className="w-full max-w-md rounded-[32px] border border-[var(--cf-primary)]/25 bg-[var(--cf-card)] p-7 text-center shadow-[0_0_80px_var(--cf-glow)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/12">
            <Sparkles className="h-7 w-7 animate-pulse text-[var(--cf-accent)]" />
          </div>

          <h2 className="mt-5 text-2xl font-black text-[var(--cf-text)]">
            Preparing today’s plan
          </h2>

          <p className="mt-3 text-sm leading-6 text-[var(--cf-text-secondary)]">
            CodeForge is turning your roadmap into focused daily tasks.
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/30">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[var(--cf-primary)] shadow-[0_0_24px_var(--cf-glow)]" />
          </div>
        </div>
      </div>
    );
  }

  const hasSpotlight = Boolean(targetRect);
  const cardStyle = getCardPosition(targetRect);

  return (
    <div className="pointer-events-none fixed inset-0 z-[140]">
      <div
        className={[
          "pointer-events-none absolute inset-0 transition-all duration-300",
          isGoalPage ? "bg-black/0" : "bg-black/18",
        ].join(" ")}
      />

      {hasSpotlight && targetRect ? (
        <div
          className={[
            "pointer-events-none absolute rounded-[24px] border transition-all duration-300 md:rounded-[28px]",
            isGoalPage
              ? "border-[var(--cf-primary)]/95 shadow-[0_0_0_9999px_rgba(0,0,0,0.02),0_0_0_1px_rgba(139,92,246,0.75),0_0_34px_rgba(139,92,246,0.42),0_0_80px_rgba(139,92,246,0.28)]"
              : "border-[var(--cf-primary)]/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.16),0_0_0_1px_rgba(139,92,246,0.70),0_0_34px_rgba(139,92,246,0.38),0_0_80px_rgba(139,92,246,0.28)]",
          ].join(" ")}
          style={{
            top: Math.max(targetRect.top - 8, 10),
            left: Math.max(targetRect.left - 8, 10),
            width: Math.min(targetRect.width + 16, window.innerWidth - 20),
            height: targetRect.height + 16,
          }}
        />
      ) : null}

      <div className="fixed transition-all duration-300" style={cardStyle}>
        <div
          className="
            pointer-events-auto relative max-h-[36vh] overflow-y-auto rounded-[24px]
            border border-white/12
            bg-[rgba(18,18,28,0.68)]
            p-4 text-[var(--cf-text)]
            shadow-[0_18px_70px_rgba(0,0,0,0.55),0_0_42px_rgba(139,92,246,0.22)]
            backdrop-blur-2xl
            before:pointer-events-none before:absolute before:inset-0
            before:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.035))]
            before:opacity-70
            md:max-h-none md:rounded-[26px]
          "
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--cf-accent)] md:text-[11px]">
                  Setup {stepIndex + 1}/{steps.length}
                </p>

                <h2 className="mt-2 text-lg font-black text-[var(--cf-text)] md:text-xl">
                  {step.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={skip}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--cf-text-muted)] backdrop-blur-xl transition hover:text-[var(--cf-text)]"
                aria-label="Skip setup guide"
              >
                <X size={17} />
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-[var(--cf-text-secondary)] md:text-sm md:leading-6">
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