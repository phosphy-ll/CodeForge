"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Code2,
  Flame,
  Gauge,
  GraduationCap,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { saveSelectedGoalId } from "@/lib/selected-goal";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type GoalTypeValue =
  | "backend_job"
  | "internship"
  | "learn_backend"
  | "build_project"
  | "prepare_interview"
  | "switch_language";

type AllowedLanguagesResponse = {
  subscription_tier: string;
  languages: string[];
  custom_language_allowed: boolean;
};

type ProgrammingLanguageValue = string;

type CodingLevelValue =
  | "absolute_beginner"
  | "beginner"
  | "junior"
  | "junior_plus"
  | "intermediate";

type LearningStyleValue =
  | "theory_first"
  | "practice_first"
  | "balanced"
  | "project_based";

type AccountabilityModeValue = "soft" | "normal" | "hard";

type FormState = {
  title: string;
  description: string;
  goal_type: GoalTypeValue | null;
  language: ProgrammingLanguageValue | null;
  declared_level: CodingLevelValue | null;
  learning_style: LearningStyleValue | null;
  accountability_mode: AccountabilityModeValue | null;
  target_months: number;
};

type OptionCard<T extends string> = {
  value: T;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const TOTAL_STEPS = 4;

const FALLBACK_LANGUAGES: AllowedLanguagesResponse = {
  subscription_tier: "free",
  languages: ["Python", "Java", "JavaScript"],
  custom_language_allowed: false,
};

const GOAL_TYPES: OptionCard<GoalTypeValue>[] = [
  {
    value: "backend_job",
    label: "Backend job",
    description: "Become strong enough to compete for backend developer roles.",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    value: "internship",
    label: "Internship",
    description: "Build a realistic path toward internship-level readiness.",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    value: "learn_backend",
    label: "Learn backend",
    description: "Build backend fundamentals through structured learning.",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    value: "build_project",
    label: "Build project",
    description: "Ship a real project while learning what matters.",
    icon: <Rocket className="h-5 w-5" />,
  },
  {
    value: "prepare_interview",
    label: "Prepare interview",
    description: "Prepare for technical interviews and coding challenges.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    value: "switch_language",
    label: "Switch language",
    description: "Transition into a new language with a structured roadmap.",
    icon: <Zap className="h-5 w-5" />,
  },
];

const LEVELS: OptionCard<CodingLevelValue>[] = [
  {
    value: "absolute_beginner",
    label: "Absolute beginner",
    description: "You are starting almost from zero.",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    value: "beginner",
    label: "Beginner",
    description: "You know basic syntax but need structure and repetition.",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    value: "junior",
    label: "Junior",
    description: "You can build simple things but need production thinking.",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    value: "junior_plus",
    label: "Junior+",
    description: "You need sharper architecture, confidence, and consistency.",
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "You already build, now you need pressure and mastery.",
    icon: <Flame className="h-5 w-5" />,
  },
];

const LEARNING_STYLES: OptionCard<LearningStyleValue>[] = [
  {
    value: "theory_first",
    label: "Theory first",
    description: "Understand concepts before implementation pressure.",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    value: "practice_first",
    label: "Practice first",
    description: "Start building quickly and learn through friction.",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Mix explanations, practice, and project work.",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    value: "project_based",
    label: "Project based",
    description: "Learn mostly through building real product pieces.",
    icon: <Rocket className="h-5 w-5" />,
  },
];

const ACCOUNTABILITY_MODES: OptionCard<AccountabilityModeValue>[] = [
  {
    value: "soft",
    label: "Flexible",
    description: "Lighter pacing with more flexibility and recovery room.",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    value: "normal",
    label: "Balanced",
    description: "Steady consistency and structured daily progress.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    value: "hard",
    label: "Focused",
    description: "Higher intensity and stronger daily consistency expectations.",
    icon: <Flame className="h-5 w-5" />,
  },
];

const MONTH_PRESETS = [1, 3, 6, 9, 12, 18, 24];

export default function NewGoalPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [allowedLanguages, setAllowedLanguages] =
    useState<AllowedLanguagesResponse>(FALLBACK_LANGUAGES);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    goal_type: null,
    language: null,
    declared_level: null,
    learning_style: null,
    accountability_mode: null,
    target_months: 6,
  });

  async function loadAllowedLanguages() {
    try {
      const response = await api.get("/goals/allowed-languages");
      setAllowedLanguages(response.data || FALLBACK_LANGUAGES);
    } catch {
      setAllowedLanguages(FALLBACK_LANGUAGES);
    }
  }

  useEffect(() => {
    loadAllowedLanguages();
  }, []);

  const recommendedMonths = useMemo(() => {
    if (form.declared_level === "absolute_beginner") return 12;
    if (form.declared_level === "beginner") return 9;
    if (form.declared_level === "junior") return 6;
    if (form.declared_level === "junior_plus") return 4;
    if (form.declared_level === "intermediate") return 3;
    return 6;
  }, [form.declared_level]);

  const pressureLabel = useMemo(() => {
    if (form.accountability_mode === "hard") return "Focused mode";
    if (form.accountability_mode === "soft") return "Flexible mode";
    return "Balanced mode";
  }, [form.accountability_mode]);

  const tooAggressive = form.target_months < recommendedMonths;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function canContinue() {
    if (step === 1) {
      return (
        form.title.trim().length >= 2 &&
        Boolean(form.goal_type) &&
        Boolean(form.language?.trim())
      );
    }

    if (step === 2) {
      return (
        Boolean(form.declared_level) &&
        Boolean(form.learning_style) &&
        Boolean(form.accountability_mode)
      );
    }

    if (step === 3) {
      return form.target_months >= 1 && form.target_months <= 24;
    }

    return true;
  }

  function nextStep() {
    if (!canContinue()) return;
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function submitGoal() {
    if (!canContinue()) return;

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post("/goals", {
        title: form.title.trim(),
        description: form.description.trim() || null,
        goal_type: form.goal_type,
        language: form.language?.trim(),
        declared_level: form.declared_level,
        learning_style: form.learning_style,
        accountability_mode: form.accountability_mode,
        target_months: form.target_months,
      });

      if (response.data?.id) {
        saveSelectedGoalId(response.data.id);
      }

      window.dispatchEvent(
        new Event("codeforge:goal-created")
      );

      router.push("/roadmap");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create goal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <button
            onClick={() => router.push("/roadmap")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--cf-text-muted)] transition hover:text-[var(--cf-accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Roadmap
          </button>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            Goal setup
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
            Create your coding roadmap
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            CodeForge will generate a personalized roadmap, daily coding tasks,
            and progress tracking based on your goal.
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-4">
          <p className="text-xs text-[var(--cf-text-muted)]">Step</p>
          <p className="mt-1 text-2xl font-black text-[var(--cf-text)]">
            {step}/{TOTAL_STEPS}
          </p>
        </div>
      </header>

      <section className="rounded-[36px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-2">
        <div className="h-3 overflow-hidden rounded-full bg-[var(--cf-bg-secondary)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7C5CFF,#A78BFA,#C4B5FD)] transition-all duration-700"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </section>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[36px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative">
          {step === 1 ? (
            <StepIdentity
              form={form}
              updateField={updateField}
              allowedLanguages={allowedLanguages}
            />
          ) : null}

          {step === 2 ? (
            <StepSkill form={form} updateField={updateField} />
          ) : null}

          {step === 3 ? (
            <StepTimeline
              months={form.target_months}
              recommendedMonths={recommendedMonths}
              tooAggressive={tooAggressive}
              updateMonths={(months) => updateField("target_months", months)}
            />
          ) : null}

          {step === 4 ? (
            <StepConfirm
              form={form}
              recommendedMonths={recommendedMonths}
              pressureLabel={pressureLabel}
              tooAggressive={tooAggressive}
            />
          ) : null}

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--cf-border)] pt-6">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={[
                "rounded-2xl border px-5 py-3 text-sm font-bold transition",
                step === 1
                  ? "cursor-not-allowed border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-muted)] opacity-45"
                  : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]",
              ].join(" ")}
            >
              Back
            </button>

            {step < TOTAL_STEPS ? (
              <LiquidGlassButton onClick={nextStep} disabled={!canContinue()}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            ) : (
              <LiquidGlassButton onClick={submitGoal} disabled={submitting}>
                {submitting ? "Forging..." : "Generate my roadmap"}
                <Sparkles className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StepIdentity({
  form,
  updateField,
  allowedLanguages,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  allowedLanguages: AllowedLanguagesResponse;
}) {
  return (
    <div className="space-y-8">
      <StepTitle
        icon={<Target className="h-6 w-6" />}
        title="Define your goal"
        text="Choose what you want to achieve and what technology path you want to follow."
      />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div data-tour="goal-title" className="space-y-5">
          <div data-tour="goal-title">
            <Label>Goal title</Label>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Example: Become job-ready Python backend developer"
              className="mt-3 w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
            />
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={8}
              placeholder="Optional: constraints, target job, project idea, current situation..."
              className="mt-3 w-full resize-none rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div data-tour="goal-type">
            <OptionGrid
              title="Goal type"
              options={GOAL_TYPES}
              value={form.goal_type}
              onChange={(value) => updateField("goal_type", value)}
            />
          </div>

          <div data-tour="goal-language">
            <LanguageSelector
              value={form.language}
              languages={allowedLanguages.languages}
              customAllowed={allowedLanguages.custom_language_allowed}
              tier={allowedLanguages.subscription_tier}
              onChange={(value) => updateField("language", value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepSkill({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div className="space-y-8">
      <StepTitle
        icon={<Brain className="h-6 w-6" />}
        title="Customize your learning path"
        text="Choose your level, learning style, and preferred pacing."
      />

      <div data-tour="goal-level">
        <OptionGrid
          title="Current level"
          options={LEVELS}
          value={form.declared_level}
          onChange={(value) => updateField("declared_level", value)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div data-tour="goal-learning-style">
          <OptionGrid
            title="Learning style"
            options={LEARNING_STYLES}
            value={form.learning_style}
            onChange={(value) => updateField("learning_style", value)}
          />
        </div>

        <div data-tour="goal-accountability">
          <OptionGrid
            title="Accountability"
            options={ACCOUNTABILITY_MODES}
            value={form.accountability_mode}
            onChange={(value) => updateField("accountability_mode", value)}
          />
        </div>
      </div>
    </div>
  );
}

function StepTimeline({
  months,
  recommendedMonths,
  tooAggressive,
  updateMonths,
}: {
  months: number;
  recommendedMonths: number;
  tooAggressive: boolean;
  updateMonths: (months: number) => void;
}) {
  return (
    <div data-tour="goal-timeline" className="space-y-8">
      <StepTitle
        icon={<Timer className="h-6 w-6" />}
        title="Choose your timeline"
        text="Pick a realistic timeframe for your roadmap and learning goals."
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-6">
          <p className="text-sm text-[var(--cf-text-muted)]">
            Selected duration
          </p>

          <p className="mt-3 text-5xl font-black text-[var(--cf-text)]">
            {months}
            <span className="ml-2 text-lg text-[var(--cf-text-secondary)]">
              months
            </span>
          </p>

          <p className="mt-5 text-sm leading-7 text-[var(--cf-text-secondary)]">
            Recommended for this level:{" "}
            <span className="font-black text-[var(--cf-accent)]">
              {recommendedMonths} months
            </span>
          </p>

          {tooAggressive ? (
            <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-7 text-amber-200">
              This timeline is ambitious. Expect a faster pace and more weekly workload.
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-200">
              This timeline gives you enough room to build steady long-term consistency.
            </div>
          )}
        </section>

        <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-6">
          <Label>Preset duration</Label>

          <div className="mt-4 flex flex-wrap gap-3">
            {MONTH_PRESETS.map((preset) => {
              const active = months === preset;

              return (
                <button
                  key={preset}
                  onClick={() => updateMonths(preset)}
                  className={[
                    "rounded-2xl border px-5 py-3 text-sm font-black transition-all duration-300",
                    active
                      ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/16 text-[var(--cf-accent)] shadow-[0_0_28px_var(--cf-glow)]"
                      : "border-[var(--cf-border)] bg-[var(--cf-card)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/30 hover:text-[var(--cf-text)]",
                  ].join(" ")}
                >
                  {preset}m
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <Label>Custom slider</Label>
              <p className="text-sm font-black text-[var(--cf-text)]">
                {months}m
              </p>
            </div>

            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={months}
              onChange={(event) => updateMonths(Number(event.target.value))}
              className="mt-5 w-full accent-violet-500"
            />

            <div className="mt-2 flex justify-between text-xs text-[var(--cf-text-muted)]">
              <span>1 month</span>
              <span>24 months</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StepConfirm({
  form,
  recommendedMonths,
  pressureLabel,
  tooAggressive,
}: {
  form: FormState;
  recommendedMonths: number;
  pressureLabel: string;
  tooAggressive: boolean;
}) {
  return (
    <div data-tour="goal-confirm" className="space-y-8">
      <StepTitle
        icon={<CheckCircle2 className="h-6 w-6" />}
        title="Review your roadmap setup"
        text="Check your configuration before generating your personalized roadmap."
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            New goal
          </p>

          <h2 className="mt-3 text-3xl font-black text-[var(--cf-text)]">
            {form.title || "Untitled goal"}
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            {form.description.trim() ||
              "No extra context. The system will build from your selected configuration."}
          </p>
        </section>

        <section className="rounded-[30px] border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 p-6 shadow-[0_0_34px_var(--cf-glow)]">
          <Flame className="h-6 w-6 text-[var(--cf-accent)]" />

          <h3 className="mt-4 text-2xl font-black text-[var(--cf-text)]">
            {pressureLabel}
          </h3>

          <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
            {tooAggressive
              ? "Your selected timeline is shorter than recommended. Expect tighter daily execution."
              : "Your selected timeline is aligned with your current level."}
          </p>
        </section>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConfirmCard label="Language" value={form.language || "—"} />
        <ConfirmCard label="Goal type" value={format(form.goal_type)} />
        <ConfirmCard label="Level" value={format(form.declared_level)} />
        <ConfirmCard label="Style" value={format(form.learning_style)} />
        <ConfirmCard label="Accountability" value={format(form.accountability_mode)} />
        <ConfirmCard label="Timeline" value={`${form.target_months} months`} />
        <ConfirmCard label="Recommended" value={`${recommendedMonths} months`} />
        <ConfirmCard label="Mode" value={tooAggressive ? "Aggressive" : "Stable"} />
      </div>
    </div>
  );
}

function OptionGrid<T extends string>({
  title,
  options,
  value,
  onChange,
  compact = false,
}: {
  title: string;
  options: OptionCard<T>[];
  value: T | null;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <Label>{title}</Label>

      <div
        className={[
          "mt-4 grid grid-cols-2 gap-3",
          compact ? "md:grid-cols-3" : "md:grid-cols-2",
        ].join(" ")}
      >
        {options.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={[
                "group relative overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-xl transition-all duration-300 md:rounded-3xl md:p-5",
                active
                  ? "border-[var(--cf-primary)]/40 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(124,92,255,0.08))] text-[var(--cf-text)] shadow-[0_0_32px_var(--cf-glow)]"
                  : "border-[var(--cf-border)] bg-white/[0.025] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/25 hover:bg-white/[0.045] hover:text-[var(--cf-text)]",
              ].join(" ")}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
              </div>

              <div className="relative">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-xl border md:h-11 md:w-11 md:rounded-2xl",
                    active
                      ? "border-[var(--cf-primary)]/35 bg-[var(--cf-primary)]/14 text-[var(--cf-accent)]"
                      : "border-[var(--cf-border)] bg-[var(--cf-card)] text-[var(--cf-text-muted)] group-hover:text-[var(--cf-accent)]",
                  ].join(" ")}
                >
                  {option.icon}
                </div>

                <p className="mt-3 text-sm font-black tracking-tight md:mt-4 md:text-lg">
                  {option.label}
                </p>

                <p className="mt-2 text-xs leading-5 text-[var(--cf-text-secondary)] md:text-sm md:leading-6">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LanguageSelector({
  value,
  languages,
  customAllowed,
  tier,
  onChange,
}: {
  value: string | null;
  languages: string[];
  customAllowed: boolean;
  tier: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>Language</Label>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {languages.map((language) => {
          const active = value?.toLowerCase() === language.toLowerCase();

          return (
            <button
              key={language}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(language)}
              className={[
                "group relative overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-xl transition-all duration-300 md:rounded-3xl md:p-5",
                active
                  ? "border-[var(--cf-primary)]/40 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(124,92,255,0.08))] text-[var(--cf-text)] shadow-[0_0_32px_var(--cf-glow)]"
                  : "border-[var(--cf-border)] bg-white/[0.025] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/25 hover:bg-white/[0.045] hover:text-[var(--cf-text)]",
              ].join(" ")}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
              </div>

              <div className="relative">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-xl border md:h-11 md:w-11 md:rounded-2xl",
                    active
                      ? "border-[var(--cf-primary)]/35 bg-[var(--cf-primary)]/14 text-[var(--cf-accent)]"
                      : "border-[var(--cf-border)] bg-[var(--cf-card)] text-[var(--cf-text-muted)] group-hover:text-[var(--cf-accent)]",
                  ].join(" ")}
                >
                  <Code2 className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-black tracking-tight md:mt-4 md:text-lg">
                  {language}
                </p>

                <p className="mt-2 text-xs text-[var(--cf-text-muted)]">
                  Available on {format(tier)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {customAllowed ? (
        <div className="mt-5">
          <Label>Custom language</Label>

          <input
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Type any language, framework, or stack..."
            className="mt-3 w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
          />
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-sm text-[var(--cf-text-secondary)]">
          Custom languages unlock on Ultra.
        </div>
      )}
    </div>
  );
}

function StepTitle({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]">
        {icon}
      </div>

      <div>
        <h2 className="text-3xl font-black text-[var(--cf-text)]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          {text}
        </p>
      </div>
    </div>
  );
}

function ConfirmCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
      <p className="text-xs text-[var(--cf-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-black text-[var(--cf-text)]">{value}</p>
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

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}