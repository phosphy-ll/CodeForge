"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  Flame,
  Gem,
  Languages,
  Lock,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type Plan = {
  id: number;
  tier: string;
  price_usd: number;
  discount_percent: number;
  is_active: boolean;
  features_json: Record<string, any>;
  created_at: string;
};

type MeResponse = {
  subscription_tier: string;
};

const TIER_ORDER = ["free", "starter", "plus", "ultra"];

const PLAN_OVERRIDES: Record<string, Record<string, any>> = {
  free: {
    ai_requests_per_day: 20,
    ai_coach_enabled: false,
    precheck_enabled: false,
    adaptive_tasks_enabled: false,
    allowed_languages: ["Python", "Java", "JavaScript"],
    custom_language_allowed: false,
    quiz_generations_per_day: 3,
  },
  starter: {
    ai_requests_per_day: 50,
    ai_coach_enabled: false,
    precheck_enabled: true,
    adaptive_tasks_enabled: false,
    allowed_languages: ["Python", "Java", "JavaScript", "C++", "Kotlin", "Go"],
    custom_language_allowed: false,
    quiz_generations_per_day: 6,
  },
  plus: {
    ai_requests_per_day: 110,
    ai_coach_enabled: true,
    precheck_enabled: true,
    adaptive_tasks_enabled: true,
    allowed_languages: [
      "Python",
      "Java",
      "JavaScript",
      "C++",
      "Kotlin",
      "Go",
      "TypeScript",
      "C#",
      "PHP",
      "Ruby",
      "Swift",
      "Rust",
    ],
    custom_language_allowed: false,
    quiz_generations_per_day: 9,
  },
  ultra: {
    ai_requests_per_day: 250,
    ai_coach_enabled: true,
    precheck_enabled: true,
    adaptive_tasks_enabled: true,
    allowed_languages: ["Any language"],
    custom_language_allowed: true,
    quiz_generations_per_day: 12,
  },
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentTier, setCurrentTier] = useState("free");
  const [expandedLanguages, setExpandedLanguages] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const plansResponse = await api.get<Plan[]>("/subscription-plans");

      setPlans(plansResponse.data);

      try {
        const meResponse = await api.get<MeResponse>("/auth/me");

        setCurrentTier(meResponse.data.subscription_tier || "free");
        setIsAuthenticated(true);
      } catch {
        setCurrentTier("free");
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        "Failed to load subscription plans."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const visiblePlans = useMemo(() => {
    const currentIndex = TIER_ORDER.indexOf(currentTier);

    return [...plans]
      .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
      .filter((plan) => {
        if (!isAuthenticated) return true;

        const planIndex = TIER_ORDER.indexOf(plan.tier);
        return planIndex >= currentIndex;
      })
      .map((plan) => ({
        ...plan,
        features_json: {
          ...plan.features_json,
          ...(PLAN_OVERRIDES[plan.tier] || {}),
        },
      }));
  }, [plans, currentTier, isAuthenticated]);

  function toggleLanguages(tier: string) {
    setExpandedLanguages((prev) => ({
      ...prev,
      [tier]: !prev[tier],
    }));
  }

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Subscription
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
          Choose your execution level
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Upgrade when you need more pressure, more AI analysis, more languages,
          stronger feedback, and faster execution growth.
        </p>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.22),transparent_35%)]" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[var(--cf-accent)]">
              <Crown className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">
                Current plan: {format(currentTier)}
              </p>
            </div>

            <h2 className="mt-4 text-5xl font-black text-[var(--cf-text)]">
              {currentTier === "ultra" ? "You are maxed out." : "Upgrade path"}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {currentTier === "ultra"
                ? "Ultra already unlocks maximum pressure, hardcore mode, highest limits, and any-language flexibility."
                : "Lower tiers are hidden. You only see your current plan and available upgrades."}
            </p>
          </div>

          <LiquidGlassButton onClick={loadData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh plans"}
            <RefreshCw className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {visiblePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentTier={currentTier}
            languagesExpanded={!!expandedLanguages[plan.tier]}
            onToggleLanguages={() => toggleLanguages(plan.tier)}
          />
        ))}
      </section>
    </main>
  );
}

function PlanCard({
  plan,
  currentTier,
  languagesExpanded,
  onToggleLanguages,
}: {
  plan: Plan;
  currentTier: string;
  languagesExpanded: boolean;
  onToggleLanguages: () => void;
}) {
  const features = plan.features_json || {};
  const isCurrent = plan.tier === currentTier;
  const isPopular = plan.tier === "plus";
  const isUltra = plan.tier === "ultra";

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[36px] border p-5 shadow-[0_20px_80px_rgba(0,0,0,0.24)] transition-all duration-300",
        isUltra
          ? "border-amber-300/35 bg-[linear-gradient(135deg,rgba(251,191,36,0.13),rgba(124,92,255,0.22),rgba(17,17,26,0.98))] shadow-[0_0_45px_rgba(251,191,36,0.12)]"
          : isPopular || isCurrent
          ? "border-[var(--cf-primary)]/40 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(17,17,26,0.96))]"
          : "border-[var(--cf-border)] bg-[var(--cf-card)]",
      ].join(" ")}
    >
      {isUltra ? (
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_32%)]" />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_34%)]" />
      )}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div
            className={[
              "flex h-12 w-12 items-center justify-center rounded-2xl border",
              isUltra
                ? "border-amber-300/40 bg-amber-300/10 text-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.26)]"
                : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]",
            ].join(" ")}
          >
            {getPlanIcon(plan.tier)}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {isCurrent ? <Badge text="Current plan" variant="success" /> : null}
            {isPopular && !isCurrent ? <Badge text="Popular" /> : null}
            {isUltra ? <Badge text="Max power" variant="gold" /> : null}
          </div>
        </div>

        <h2 className="mt-5 text-3xl font-black text-[var(--cf-text)]">
          {format(plan.tier)}
        </h2>

        <div className="mt-4 flex items-end gap-2">
          <p className="text-5xl font-black text-[var(--cf-text)]">
            ${plan.price_usd}
          </p>
          <p className="mb-3 text-sm text-[var(--cf-text-muted)]">/mo</p>
        </div>

        <p className="mt-3 min-h-[48px] text-sm leading-6 text-[var(--cf-text-secondary)]">
          {getPlanPitch(plan.tier)}
        </p>

        <div className="mt-6">
          <LiquidGlassButton
            className={[
              "w-full justify-center",
              isUltra ? "shadow-[0_0_30px_rgba(251,191,36,0.20)]" : "",
            ].join(" ")}
            disabled={isCurrent}
            onClick={() => {
              if (isCurrent) return;

              // Later: replace with Paddle checkout call.
              console.log("TODO: open Paddle checkout for", plan.tier);
            }}
          >
            {isCurrent ? "Current plan" : `Upgrade to ${format(plan.tier)}`}
            <Sparkles className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>

        <div className="mt-4 space-y-2">
          <Feature icon={<Target />} text={`${features.max_active_goals} active goal${features.max_active_goals > 1 ? "s" : ""}`} />
          <Feature icon={<Flame />} text={`${features.daily_tasks_min}-${features.daily_tasks_max} daily tasks`} />
          <Feature icon={<Zap />} text={`${features.max_daily_points} max daily points`} />
          <Feature icon={<Brain />} text={`${format(features.ai_level)} AI level`} />
          <Feature icon={<Sparkles />} text={`${features.ai_requests_per_day} AI requests/day`} />
          <Feature icon={<Shield />} text={`${features.quiz_generations_per_day} quiz generations/day`} />

          <LanguagesBox
            languages={features.allowed_languages || []}
            customAllowed={!!features.custom_language_allowed}
            expanded={languagesExpanded}
            onToggle={onToggleLanguages}
          />

          <BooleanFeature enabled={features.weakness_map} text="Weakness map" />
          <BooleanFeature enabled={features.ai_coach_enabled} text="AI Coach chat" />
          <BooleanFeature enabled={features.precheck_enabled} text="Precheck flow" />
          <BooleanFeature enabled={features.adaptive_difficulty} text="Adaptive difficulty" />
          <BooleanFeature enabled={features.adaptive_tasks_enabled} text="Adaptive tasks" />
          <BooleanFeature enabled={features.hardcore_allowed} text="Hardcore mode" />
        </div>
      </div>
    </article>
  );
}

function LanguagesBox({
  languages,
  customAllowed,
  expanded,
  onToggle,
}: {
  languages: string[];
  customAllowed: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const visibleLanguages = expanded ? languages : languages.slice(0, 4);

  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-black/15 p-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left text-sm text-[var(--cf-text-secondary)]"
      >
        <span className="flex items-center gap-3">
          <Languages className="h-4 w-4 text-[var(--cf-accent)]" />
          {customAllowed ? "Any language" : `${languages.length} languages`}
        </span>   

        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--cf-text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--cf-text-muted)]" />
        )}
      </button>

      {expanded ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleLanguages.map((language) => (
            <span
              key={language}
              className="rounded-full border border-[var(--cf-primary)]/20 bg-[var(--cf-primary)]/10 px-3 py-1 text-xs font-bold text-[var(--cf-accent)]"
            >
              {language}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--cf-border)] bg-black/15 px-3 py-2 text-sm text-[var(--cf-text-secondary)]">
      <span className="text-[var(--cf-accent)] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {text}
    </div>
  );
}

function BooleanFeature({ enabled, text }: { enabled: boolean; text: string }) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
        enabled
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-[var(--cf-border)] bg-black/15 text-[var(--cf-text-muted)]",
      ].join(" ")}
    >
      {enabled ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      {text}
    </div>
  );
}

function Badge({
  text,
  variant = "default",
}: {
  text: string;
  variant?: "default" | "gold" | "success";
}) {
  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]",
        variant === "gold"
          ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
          : variant === "success"
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]",
      ].join(" ")}
    >
      {text}
    </span>
  );
}

function getPlanIcon(tier: string) {
  if (tier === "ultra") return <Gem className="h-7 w-7" />;
  if (tier === "plus") return <Crown className="h-7 w-7" />;
  if (tier === "starter") return <Flame className="h-7 w-7" />;
  return <Shield className="h-7 w-7" />;
}

function getPlanPitch(tier: string) {
  if (tier === "free") return "For trying CodeForge and proving basic execution.";
  if (tier === "starter") return "For consistent learners who need more tasks and precheck.";
  if (tier === "plus") return "Best for serious growth: AI coach, adaptive tasks, weakness map.";
  return "Maximum pressure, hardcore mode, highest limits, gold-tier execution, and any language.";
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