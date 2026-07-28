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
  Lock,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Trophy,
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
  beta_tester?: boolean;
  subscription_expires_at?: string | null;
  polar_subscription_cancel_at_period_end?: boolean;
  polar_subscription_current_period_end?: string | null;
};

type CheckoutResponse = {
  url?: string;
  error?: string;
};

const TIER_ORDER = ["free", "starter", "plus", "ultra"];

const BASE_PRICES: Record<string, number> = {
  starter: 6.5,
  plus: 12.5,
  ultra: 25,
};

const BETA_PACK = {
  tier: "beta",
  title: "Founding Beta Access",
  price: 25,
  value: 50,
  discount: 50,
  description:
    "One-time beta pack: 2 months of Ultra, permanent Beta Tester achievement, and early supporter status.",
  features: [
    "2 months of CodeForge Ultra",
    "Permanent Beta Tester achievement",
    "Early supporter status",
    "No monthly commitment",
  ],
};

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
  const [betaTester, setBetaTester] = useState(false);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const plansResponse = await api.get<Plan[]>("/subscription-plans");
      setPlans(plansResponse.data);

      try {
        const meResponse = await api.get<MeResponse>("/auth/me");
        setCurrentTier(meResponse.data.subscription_tier || "free");
        setBetaTester(Boolean(meResponse.data.beta_tester));
        setSubscriptionExpiresAt(meResponse.data.subscription_expires_at || null);
        setCancelAtPeriodEnd(
          Boolean(meResponse.data.polar_subscription_cancel_at_period_end)
        );

        setCurrentPeriodEnd(
          meResponse.data.polar_subscription_current_period_end || null
        );
        setIsAuthenticated(true);
      } catch {
        setCurrentTier("free");
        setIsAuthenticated(false);
        setBetaTester(false);
        setSubscriptionExpiresAt(null);
        setCancelAtPeriodEnd(false);
        setCurrentPeriodEnd(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load subscription plans.");
    } finally {
      setLoading(false);
    }
  }

  async function openCheckout(tier: string) {
    try {
      setCheckoutLoading(tier);
      setError("");

      const response = await api.post<CheckoutResponse>("/billing/checkout", {
        tier,
      });

      if (!response.data.url) {
        throw new Error(response.data.error || "Checkout URL was not returned.");
      }

      window.location.href = response.data.url;
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to open checkout."
      );
    } finally {
      setCheckoutLoading(null);
    }
  }
  async function cancelSubscription() {
    const ok = window.confirm(
      "Cancel your current subscription? Your paid access may be downgraded after Polar confirms cancellation."
    );

    if (!ok) return;

    try {
      setCancelLoading(true);
      setError("");

      await api.post("/billing/cancel");

      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to cancel subscription."
      );
    } finally {
      setCancelLoading(false);
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
        return TIER_ORDER.indexOf(plan.tier) >= currentIndex;
      })
      .map((plan) => ({
        ...plan,
        features_json: {
          ...plan.features_json,
          ...(PLAN_OVERRIDES[plan.tier] || {}),
        },
      }));
  }, [plans, currentTier, isAuthenticated]);

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Subscription
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--cf-text)] md:text-5xl">
          Choose your execution level
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Upgrade for more pressure, stronger AI feedback, more languages, and faster execution growth.
        </p>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <SubscriptionStatus
        currentTier={currentTier}
        betaTester={betaTester}
        subscriptionExpiresAt={subscriptionExpiresAt}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        currentPeriodEnd={currentPeriodEnd}
        onCancel={cancelSubscription}
        cancelLoading={cancelLoading}
      />

      <BetaCard
        loading={checkoutLoading === "beta"}
        onCheckout={() => openCheckout("beta")}
      />

      <section className="relative overflow-hidden rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] md:rounded-[38px] md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.22),transparent_35%)]" />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 text-[var(--cf-accent)]">
              <Crown className="h-5 w-5" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Current plan: {format(currentTier)}
              </p>
            </div>

            <h2 className="mt-3 text-3xl font-black text-[var(--cf-text)] md:text-5xl">
              {currentTier === "ultra" ? "You are maxed out." : "Upgrade path"}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {currentTier === "ultra"
                ? "Ultra already unlocks maximum execution depth."
                : "Lower tiers are hidden. You see your current plan and available upgrades."}
            </p>
          </div>

          <LiquidGlassButton onClick={loadData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
            <RefreshCw className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        {visiblePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentTier={currentTier}
            loading={checkoutLoading === plan.tier}
            onCheckout={() => openCheckout(plan.tier)}
          />
        ))}
      </section>
    </main>
  );
}

function BetaCard({
  loading,
  onCheckout,
}: {
  loading: boolean;
  onCheckout: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-amber-300/35 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(124,92,255,0.22),rgba(17,17,26,0.98))] p-5 shadow-[0_0_60px_rgba(251,191,36,0.12)] md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.20),transparent_35%)]" />

      <div className="relative grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-300/10 text-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.26)]">
              <Trophy className="h-6 w-6" />
            </div>

            <Badge text="One-time beta access" variant="gold" />
            <Badge text={`Save ${BETA_PACK.discount}%`} variant="gold" />
          </div>

          <h2 className="mt-5 text-3xl font-black text-[var(--cf-text)] md:text-5xl">
            {BETA_PACK.title}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            {BETA_PACK.description}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
            {BETA_PACK.features.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-amber-300/15 bg-black/18 px-3 py-3 text-xs font-bold leading-5 text-amber-100/90"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
            Beta deal
          </p>

          <div className="mt-3 flex items-end gap-3">
            <p className="text-5xl font-black text-[var(--cf-text)]">
              ${BETA_PACK.price}
            </p>
            <div className="mb-2">
              <p className="text-sm text-[var(--cf-text-muted)] line-through">
                ${BETA_PACK.value}
              </p>
              <p className="text-xs font-bold text-amber-200">one-time</p>
            </div>
          </div>

          <LiquidGlassButton
            className="mt-5 w-full justify-center shadow-[0_0_34px_rgba(251,191,36,0.20)]"
            onClick={onCheckout}
            disabled={loading}
          >
            {loading ? "Opening..." : "Get Beta Access"}
            <Sparkles className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  currentTier,
  loading,
  onCheckout,
}: {
  plan: Plan;
  currentTier: string;
  loading: boolean;
  onCheckout: () => void;
}) {
  const [languagesOpen, setLanguagesOpen] = useState(false);

  const features = plan.features_json || {};
  const isCurrent = plan.tier === currentTier;
  const isPopular = plan.tier === "plus";
  const isUltra = plan.tier === "ultra";
  const basePrice = BASE_PRICES[plan.tier];

  const discount =
    basePrice && plan.price_usd < basePrice
      ? Math.round(((basePrice - plan.price_usd) / basePrice) * 100)
      : plan.discount_percent || 0;

  const languages = features.allowed_languages || [];
  const languagesLabel =
    plan.tier === "ultra" ? "All languages" : `${languages.length} languages`;

  return (
    <article
      className={[
        "group relative min-h-[360px] overflow-hidden rounded-[26px] border p-4 shadow-[0_16px_55px_rgba(0,0,0,0.22)] transition-all duration-300 md:rounded-[32px] md:p-5",
        isUltra
          ? "border-amber-300/35 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(124,92,255,0.18),rgba(17,17,26,0.98))]"
          : isPopular || isCurrent
          ? "border-[var(--cf-primary)]/40 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(17,17,26,0.96))]"
          : "border-[var(--cf-border)] bg-[var(--cf-card)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_34%)]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div
            className={[
              "flex h-10 w-10 items-center justify-center rounded-2xl border md:h-12 md:w-12",
              isUltra
                ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]",
            ].join(" ")}
          >
            {getPlanIcon(plan.tier)}
          </div>

          <div className="flex flex-wrap justify-end gap-1">
            {isCurrent ? <Badge text="Current" variant="success" /> : null}
            {isPopular && !isCurrent ? <Badge text="Popular" /> : null}
            {isUltra ? <Badge text="Max" variant="gold" /> : null}
            {discount > 0 && !isCurrent ? <Badge text={`-${discount}%`} /> : null}
          </div>
        </div>

        <h2 className="mt-4 text-2xl font-black text-[var(--cf-text)] md:text-3xl">
          {format(plan.tier)}
        </h2>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <p className="text-4xl font-black text-[var(--cf-text)] md:text-5xl">
            ${plan.price_usd}
          </p>
          <p className="mb-2 text-xs text-[var(--cf-text-muted)] md:text-sm">/mo</p>

          {basePrice && basePrice > plan.price_usd ? (
            <p className="mb-2 text-xs text-[var(--cf-text-muted)] line-through">
              ${basePrice}
            </p>
          ) : null}
        </div>

        <p className="mt-3 min-h-[44px] text-xs leading-5 text-[var(--cf-text-secondary)] md:text-sm md:leading-6">
          {getPlanPitch(plan.tier)}
        </p>

        <div className="mt-5">
          <LiquidGlassButton
            className="w-full justify-center px-3 py-3 text-xs md:text-sm"
            disabled={isCurrent || loading || plan.tier === "free"}
            onClick={() => {
              if (isCurrent || plan.tier === "free") return;
              onCheckout();
            }}
          >
            {loading
              ? "Opening..."
              : isCurrent
              ? "Current"
              : plan.tier === "free"
              ? "Free"
              : "Upgrade"}
            <Sparkles className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>

        <div className="mt-4 space-y-2">
          <CompactFeature
            icon={<Target />}
            text={`${features.max_active_goals} goal${features.max_active_goals > 1 ? "s" : ""}`}
          />
          <CompactFeature icon={<Flame />} text={`${features.daily_tasks_min}-${features.daily_tasks_max} tasks/day`} />
          <CompactFeature icon={<Zap />} text={`${features.max_daily_points} pts/day`} />
          <CompactFeature icon={<Brain />} text={`${format(features.ai_level)} AI`} />
          <CompactFeature icon={<Sparkles />} text={`${features.ai_requests_per_day} AI req/day`} />
          <CompactFeature icon={<Shield />} text={`${features.quiz_generations_per_day} quizzes/day`} />

          <LanguageFeature
            label={languagesLabel}
            languages={languages}
            open={languagesOpen}
            onToggle={() => setLanguagesOpen((prev) => !prev)}
            isUltra={plan.tier === "ultra"}
          />

          <BooleanFeature enabled={features.weakness_map} text="Weakness map" />
          <BooleanFeature enabled={features.ai_coach_enabled} text="AI Coach" />
          <BooleanFeature enabled={features.precheck_enabled} text="Precheck" />
          <BooleanFeature enabled={features.hardcore_allowed} text="Hardcore" />
        </div>
      </div>
    </article>
  );
}

function LanguageFeature({
  label,
  languages,
  open,
  onToggle,
  isUltra,
}: {
  label: string;
  languages: string[];
  open: boolean;
  onToggle: () => void;
  isUltra: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-black/15">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs text-[var(--cf-text-secondary)] md:text-sm"
      >
        <span className="flex items-center gap-2">
          <span className="text-[var(--cf-accent)]">
            <Sparkles className="h-4 w-4" />
          </span>
          {label}
        </span>

        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--cf-text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--cf-text-muted)]" />
        )}
      </button>

      {open ? (
        <div className="border-t border-white/5 px-3 pb-3 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {isUltra ? (
              <span className="rounded-full border border-[var(--cf-primary)]/20 bg-[var(--cf-primary)]/10 px-2 py-1 text-[10px] font-bold text-[var(--cf-accent)]">
                Any language
              </span>
            ) : (
              languages.map((language) => (
                <span
                  key={language}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-[var(--cf-text-secondary)]"
                >
                  {language}
                </span>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CompactFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--cf-border)] bg-black/15 px-3 py-2 text-xs text-[var(--cf-text-secondary)] md:text-sm">
      <span className="text-[var(--cf-accent)] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function BooleanFeature({ enabled, text }: { enabled: boolean; text: string }) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs md:text-sm",
        enabled
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-[var(--cf-border)] bg-black/15 text-[var(--cf-text-muted)]",
      ].join(" ")}
    >
      {enabled ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Lock className="h-4 w-4 shrink-0" />}
      <span className="truncate">{text}</span>
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
        "rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] md:px-3 md:text-xs",
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
  if (tier === "ultra") return <Gem className="h-5 w-5 md:h-6 md:w-6" />;
  if (tier === "plus") return <Crown className="h-5 w-5 md:h-6 md:w-6" />;
  if (tier === "starter") return <Flame className="h-5 w-5 md:h-6 md:w-6" />;
  return <Shield className="h-5 w-5 md:h-6 md:w-6" />;
}

function getPlanPitch(tier: string) {
  if (tier === "free") return "Try CodeForge and prove basic execution.";
  if (tier === "starter") return "More tasks, precheck, and better structure.";
  if (tier === "plus") return "AI coach, adaptive tasks, weakness map.";
  return "Maximum pressure, hardcore mode, any language.";
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

function SubscriptionStatus({
  currentTier,
  betaTester,
  subscriptionExpiresAt,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  onCancel,
  cancelLoading,
}: {
  currentTier: string;
  betaTester: boolean;
  subscriptionExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  onCancel: () => void;
  cancelLoading: boolean;
}) {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const checkoutSuccess = params.get("checkout") === "success";
  const expiresInDays = getDaysUntil(subscriptionExpiresAt);
  const periodEndsInDays = getDaysUntil(currentPeriodEnd);

  const periodBadgeText = cancelAtPeriodEnd
    ? periodEndsInDays
      ? `Ends in ${periodEndsInDays}d`
      : "Cancellation scheduled"
    : periodEndsInDays
    ? `Renews in ${periodEndsInDays}d`
    : null;

  const isPaidSubscription = currentTier !== "free" && !subscriptionExpiresAt;

  if (!checkoutSuccess && !betaTester && !expiresInDays && !isPaidSubscription) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-4 shadow-[0_0_42px_rgba(16,185,129,0.12)] md:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_34%)]" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          {checkoutSuccess ? (
            <p className="text-sm font-black text-emerald-200">
              Upgrade successful.
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge text={`Current: ${format(currentTier)}`} variant="success" />

            {betaTester ? <Badge text="Beta Tester" variant="gold" /> : null}

            {expiresInDays ? (
              <Badge text={`Ultra expires in ${expiresInDays}d`} />
            ) : null}

            {periodBadgeText ? (
              <Badge
                text={periodBadgeText}
                variant={cancelAtPeriodEnd ? "gold" : "default"}
              />
            ) : null}
          </div>
        </div>

        {isPaidSubscription && !cancelAtPeriodEnd ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelLoading}
            className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/50 transition hover:border-rose-300/30 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLoading ? "Scheduling..." : "Cancel renewal"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function getDaysUntil(dateString?: string | null) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const diff = date.getTime() - Date.now();
  if (diff <= 0) return null;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}