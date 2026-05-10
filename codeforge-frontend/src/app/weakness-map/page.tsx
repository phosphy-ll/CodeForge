"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  Brain,
  ChevronDown,
  Flame,
  Gauge,
  Medal,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type WeaknessItem = {
  skill_name: string;
  weakness_score: number;
  level: "low" | "medium" | "high" | string;
};

type WeaknessMapResponse = {
  items: WeaknessItem[];
};

type WeaknessTier = "high" | "medium" | "low" | "good" | "master";
type FilterTier = "all" | WeaknessTier;

type TierConfig = {
  tier: WeaknessTier;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  cardClass: string;
  badgeClass: string;
  barClass: string;
  priority: number;
};

const FILTERS: { value: FilterTier; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "good", label: "Good" },
  { value: "master", label: "Master" },
];

const TIER_ORDER: WeaknessTier[] = ["high", "medium", "low", "good", "master"];

export default function WeaknessMapPage() {
  const [data, setData] = useState<WeaknessMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState<FilterTier>("all");
  const [collapsed, setCollapsed] = useState<Record<WeaknessTier, boolean>>({
    high: false,
    medium: false,
    low: false,
    good: true,
    master: true,
  });

  async function loadMap(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await api.get("/ai/weakness-map");
      setData(response.data || { items: [] });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load weakness map.");
      setData({ items: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadMap();
  }, []);

  const stats = useMemo(() => {
    const rawItems = data?.items || [];

    const normalizedItems = rawItems
      .map((item) => {
        const percent = normalizePercent(item.weakness_score);
        const tier = getWeaknessTier(percent);

        return {
          ...item,
          percent,
          tier,
        };
      })
      .sort((a, b) => {
        const tierA = getTierConfig(a.tier).priority;
        const tierB = getTierConfig(b.tier).priority;

        if (tierA !== tierB) return tierA - tierB;
        return b.percent - a.percent;
      });

    const counts = {
      all: normalizedItems.length,
      high: normalizedItems.filter((item) => item.tier === "high").length,
      medium: normalizedItems.filter((item) => item.tier === "medium").length,
      low: normalizedItems.filter((item) => item.tier === "low").length,
      good: normalizedItems.filter((item) => item.tier === "good").length,
      master: normalizedItems.filter((item) => item.tier === "master").length,
    };

    const grouped = TIER_ORDER.reduce((acc, tier) => {
      acc[tier] = normalizedItems.filter((item) => item.tier === tier);
      return acc;
    }, {} as Record<WeaknessTier, Array<WeaknessItem & { percent: number; tier: WeaknessTier }>>);

    const visibleItems =
      activeFilter === "all"
        ? normalizedItems
        : normalizedItems.filter((item) => item.tier === activeFilter);

    const average = normalizedItems.length
      ? Math.round(
          normalizedItems.reduce((sum, item) => sum + item.percent, 0) /
            normalizedItems.length
        )
      : 0;

    const topWeakness = normalizedItems[0];

    return {
      rawItems,
      items: normalizedItems,
      visibleItems,
      grouped,
      counts,
      average,
      topWeakness,
    };
  }, [data, activeFilter]);

  if (loading) return <WeaknessSkeleton />;

  return (
    <main className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            Weakness map
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
            Skill risk analysis
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            CodeForge tracks weak areas from submissions, review results, and
            verified proof. High-risk skills get pushed back into your execution
            loop. Stable skills stay monitored, not spammed.
          </p>
        </div>

        <LiquidGlassButton
          onClick={() => loadMap(true)}
          disabled={refreshing}
          className="min-w-[220px] justify-center"
        >
          {refreshing ? "Refreshing..." : "Refresh map"}
        </LiquidGlassButton>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--cf-accent)]">
              <Brain className="h-4 w-4" />
              Adaptive diagnosis
            </div>

            <h2 className="mt-6 max-w-4xl text-3xl font-black leading-tight tracking-tight text-[var(--cf-text)] xl:text-4xl">
              {stats.topWeakness
                ? `${formatSkill(stats.topWeakness.skill_name)} is your highest current weakness.`
                : "No weakness data yet."}
            </h2>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {stats.topWeakness
                ? getHeroText(stats.topWeakness.tier)
                : "Submit more tasks and reviews first. Weakness data becomes useful after CodeForge sees your proof quality."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Average weakness" value={`${stats.average}%`} />
            <Metric label="Tracked skills" value={String(stats.counts.all)} />
            <Metric label="High risk" value={String(stats.counts.high)} />
            <Metric label="Mastered" value={String(stats.counts.master)} />
          </div>
        </div>
      </section>

      {stats.items.length === 0 ? (
        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
          <ShieldCheck className="h-8 w-8 text-[var(--cf-accent)]" />

          <h2 className="mt-5 text-3xl font-black text-[var(--cf-text)]">
            Not enough data yet.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            Complete and submit more tasks. Weakness Map becomes valuable after
            CodeForge has reviewed your real proof.
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-5">
            <div className="flex flex-wrap gap-3">
              {FILTERS.map((filter) => {
                const active = activeFilter === filter.value;
                const count = stats.counts[filter.value];

                return (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={[
                      "group relative overflow-hidden rounded-2xl border px-5 py-3 text-sm font-black backdrop-blur-xl transition-all duration-300",
                      active
                        ? "border-[var(--cf-primary)]/40 bg-[linear-gradient(135deg,rgba(124,92,255,0.20),rgba(124,92,255,0.08))] text-[var(--cf-text)] shadow-[0_0_28px_var(--cf-glow)]"
                        : "border-[var(--cf-border)] bg-white/[0.025] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/25 hover:bg-white/[0.045] hover:text-[var(--cf-text)]",
                    ].join(" ")}
                  >
                    <span className="relative z-10">
                      {filter.label}{" "}
                      <span className="text-[var(--cf-text-muted)]">
                        {count}
                      </span>
                    </span>

                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                      <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              {activeFilter === "all" ? (
                TIER_ORDER.map((tier) => {
                  const items = stats.grouped[tier];
                  const config = getTierConfig(tier);

                  if (items.length === 0) return null;

                  const isCollapsed = collapsed[tier];

                  return (
                    <section
                      key={tier}
                      className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-5"
                    >
                      <button
                        onClick={() =>
                          setCollapsed((prev) => ({
                            ...prev,
                            [tier]: !prev[tier],
                          }))
                        }
                        className="flex w-full items-center justify-between gap-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "flex h-11 w-11 items-center justify-center rounded-2xl border",
                              config.badgeClass,
                            ].join(" ")}
                          >
                            {config.icon}
                          </div>

                          <div>
                            <h2 className="text-xl font-black text-[var(--cf-text)]">
                              {config.label}
                            </h2>

                            <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">
                              {items.length} skills • {config.description}
                            </p>
                          </div>
                        </div>

                        <ChevronDown
                          className={[
                            "h-5 w-5 text-[var(--cf-text-muted)] transition",
                            isCollapsed ? "" : "rotate-180",
                          ].join(" ")}
                        />
                      </button>

                      {!isCollapsed ? (
                        <div className="mt-5 space-y-4">
                          {items.map((item) => (
                            <WeaknessCard key={item.skill_name} item={item} />
                          ))}
                        </div>
                      ) : null}
                    </section>
                  );
                })
              ) : stats.visibleItems.length > 0 ? (
                <div className="space-y-4">
                  {stats.visibleItems.map((item) => (
                    <WeaknessCard key={item.skill_name} item={item} />
                  ))}
                </div>
              ) : (
                <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
                  <h2 className="text-2xl font-black text-[var(--cf-text)]">
                    No skills in this filter.
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
                    Pick another tier or submit more tasks to generate more
                    skill data.
                  </p>
                </section>
              )}
            </div>

            <aside className="space-y-5">
              <GlassCard
                title="Priority focus"
                icon={<Target className="h-5 w-5" />}
              >
                <p className="text-sm leading-7 text-[var(--cf-text-secondary)]">
                  {stats.topWeakness
                    ? `Focus on ${formatSkill(
                        stats.topWeakness.skill_name
                      )}. Your daily plan should include explanation, implementation, and proof for this skill.`
                    : "No priority focus yet."}
                </p>
              </GlassCard>

              <GlassCard
                title="Tier system"
                icon={<Gauge className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  <RiskRow label="High" text="70–100% weakness" />
                  <RiskRow label="Medium" text="40–70% weakness" />
                  <RiskRow label="Low" text="15–40% weakness" />
                  <RiskRow label="Good" text="5–15% weakness" />
                  <RiskRow label="Master" text="0–5% weakness" />
                </div>
              </GlassCard>

              <GlassCard
                title="How to reduce weakness"
                icon={<Zap className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  <Action text="Complete one learning task with a clear explanation." />
                  <Action text="Submit working code, not just text." />
                  <Action text="Explain why your solution works and where it can fail." />
                  <Action text="Fix rejected or needs-revision submissions first." />
                </div>
              </GlassCard>
            </aside>
          </section>
        </>
      )}
    </main>
  );
}

function WeaknessCard({
  item,
}: {
  item: WeaknessItem & { percent: number; tier: WeaknessTier };
}) {
  const config = getTierConfig(item.tier);

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[34px] border p-6 transition-all duration-300",
        config.cardClass,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black",
                config.badgeClass,
              ].join(" ")}
            >
              {config.icon}
              {config.shortLabel}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-[var(--cf-text)]">
            {formatSkill(item.skill_name)}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--cf-text-secondary)]">
            {getWeaknessText(item.tier)}
          </p>
        </div>

        <div className="w-full shrink-0 xl:w-[260px]">
          <div className="flex items-end justify-between">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--cf-text-muted)]">
              Weakness
            </p>
            <p className="text-3xl font-black text-[var(--cf-text)]">
              {item.percent}%
            </p>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-[3px]">
            <div
              className={[
                "relative h-full overflow-hidden rounded-full transition-all duration-700",
                config.barClass,
              ].join(" ")}
              style={{ width: `${Math.max(item.percent, 4)}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.06)_45%,rgba(255,255,255,0.16))]" />
              <div className="absolute -left-1/2 top-[-50%] h-[200%] w-[45%] rotate-12 animate-[glassFlow_2.8s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)] blur-md" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function GlassCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.12),transparent_35%)]" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]">
            {icon}
          </div>

          <h2 className="text-xl font-black tracking-tight text-[var(--cf-text)]">
            {title}
          </h2>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function Action({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-sm leading-6 text-[var(--cf-text-secondary)]">
      {text}
    </div>
  );
}

function RiskRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
      <p className="text-sm font-black text-[var(--cf-text)]">{label}</p>
      <p className="text-right text-sm text-[var(--cf-text-secondary)]">{text}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4">
      <p className="text-xs text-[var(--cf-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--cf-text)]">{value}</p>
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

function WeaknessSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-80 animate-pulse rounded-2xl bg-[var(--cf-card)]" />
      <div className="h-72 animate-pulse rounded-[38px] bg-[var(--cf-card)]" />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
        <div className="h-96 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
      </div>
    </div>
  );
}

function getWeaknessTier(percent: number): WeaknessTier {
  if (percent <= 5) return "master";
  if (percent <= 15) return "good";
  if (percent < 45) return "low";
  if (percent < 70) return "medium";
  return "high";
}

function getTierConfig(tier: WeaknessTier): TierConfig {
  const configs: Record<WeaknessTier, TierConfig> = {
    high: {
      tier: "high",
      label: "High risk",
      shortLabel: "High",
      description: "blocking progress",
      icon: <Flame className="h-4 w-4" />,
      cardClass: "border-rose-500/25 bg-rose-500/10",
      badgeClass: "border-rose-500/25 bg-rose-500/10 text-rose-300",
      barClass: "bg-[linear-gradient(90deg,#F43F5E,#FB7185)]",
      priority: 1,
    },
    medium: {
      tier: "medium",
      label: "Medium risk",
      shortLabel: "Medium",
      description: "unstable skill",
      icon: <AlertTriangle className="h-4 w-4" />,
      cardClass: "border-amber-500/25 bg-amber-500/10",
      badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-300",
      barClass: "bg-[linear-gradient(90deg,#F59E0B,#FBBF24)]",
      priority: 2,
    },
    low: {
      tier: "low",
      label: "Low risk",
      shortLabel: "Low",
      description: "watch but not urgent",
      icon: <ShieldCheck className="h-4 w-4" />,
      cardClass: "border-[var(--cf-border)] bg-[var(--cf-card)]",
      badgeClass:
        "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]",
      barClass: "bg-[linear-gradient(90deg,#7C5CFF,#A78BFA,#C4B5FD)]",
      priority: 3,
    },
    good: {
      tier: "good",
      label: "Good level",
      shortLabel: "Good",
      description: "stable skill",
      icon: <Sparkles className="h-4 w-4" />,
      cardClass: "border-emerald-500/20 bg-emerald-500/8",
      badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
      barClass: "bg-[linear-gradient(90deg,#10B981,#34D399)]",
      priority: 4,
    },
    master: {
      tier: "master",
      label: "Master level",
      shortLabel: "Master",
      description: "strong and stable",
      icon: <Award className="h-4 w-4" />,
      cardClass: "border-yellow-400/25 bg-yellow-400/8",
      badgeClass: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
      barClass: "bg-[linear-gradient(90deg,#F59E0B,#FDE68A)]",
      priority: 5,
    },
  };

  return configs[tier];
}

function getWeaknessText(tier: WeaknessTier) {
  if (tier === "high") {
    return "This skill is currently blocking progress. CodeForge should keep pushing it into daily plans until proof improves.";
  }

  if (tier === "medium") {
    return "This skill is unstable. You can use it sometimes, but proof quality is not reliable yet.";
  }

  if (tier === "low") {
    return "This skill is not urgent, but still needs occasional practice to avoid regression.";
  }

  if (tier === "good") {
    return "This skill is mostly stable. Keep it warm, but do not waste daily pressure here.";
  }

  return "This skill is currently mastered. It should stay collapsed unless regression appears.";
}

function getHeroText(tier: WeaknessTier) {
  if (tier === "high") {
    return "This needs direct pressure. Your next daily plans should attack it with learning, implementation, and proof.";
  }

  if (tier === "medium") {
    return "This is not catastrophic, but it is unstable. Repeated proof-based practice should reduce it.";
  }

  if (tier === "low") {
    return "Your highest weakness is currently manageable. Keep executing and prevent regression.";
  }

  if (tier === "good") {
    return "Most tracked skills look stable. Keep submitting proof to maintain this level.";
  }

  return "Your tracked skills are in strong shape. The system will keep monitoring for regression.";
}

function normalizePercent(score: number) {
  const normalized = score > 1 ? score : score * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSkill(value?: string | null) {
  if (!value) return "Unknown skill";
  return format(value);
}