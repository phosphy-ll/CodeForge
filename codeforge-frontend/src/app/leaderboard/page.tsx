"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Flame,
  Medal,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type PeriodType = "daily" | "weekly" | "monthly";

type LeaderboardEntry = {
  id: number;
  user_id: number;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  score_points: number;
  verified_tasks: number;
  rank: number;
  created_at: string;
  updated_at: string;
};

type LeaderboardResponse = {
  period_type: PeriodType;
  period_start: string;
  top_entries: LeaderboardEntry[];
  current_user_entry: LeaderboardEntry | null;
};

const PERIODS: { label: string; value: PeriodType }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeaderboard(selectedPeriod = period) {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<LeaderboardResponse>(
        `/leaderboard/${selectedPeriod}`
      );

      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const current = data?.current_user_entry ?? null;
  const topEntries = data?.top_entries ?? [];

  const totalPoints = useMemo(() => {
    return topEntries.reduce((sum, item) => sum + item.score_points, 0);
  }, [topEntries]);

  const topScore = topEntries[0]?.score_points ?? 0;

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Leaderboard
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
          Execution arena
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Compete through verified execution. Points come from real proof, not
          checkbox progress.
        </p>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.22),transparent_35%)]" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[var(--cf-accent)]">
              <Trophy className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">
                Current season
              </p>
            </div>

            <h2 className="mt-4 text-5xl font-black text-[var(--cf-text)]">
              {format(period)} Arena
            </h2>

            <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
              Period starts {formatDate(data?.period_start)}. Your rank updates
              as verified points enter the arena.
            </p>
          </div>

          <LiquidGlassButton onClick={() => loadLeaderboard(period)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
            <RefreshCw className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>

        <div className="relative mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Crown className="h-5 w-5" />}
            label="Your rank"
            value={current ? `#${current.rank}` : "—"}
          />

          <MetricCard
            icon={<Flame className="h-5 w-5" />}
            label="Your points"
            value={`${current?.score_points ?? 0}`}
          />

          <MetricCard
            icon={<Target className="h-5 w-5" />}
            label="Verified"
            value={`${current?.verified_tasks ?? 0}`}
          />

          <MetricCard
            icon={<Zap className="h-5 w-5" />}
            label="Top score"
            value={`${topScore}`}
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-4">
        <div className="flex flex-wrap gap-3">
          {PERIODS.map((item) => {
            const active = period === item.value;

            return (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value)}
                className={[
                  "rounded-2xl border px-5 py-3 text-sm font-black transition-all duration-300",
                  active
                    ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/14 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]"
                    : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/30 hover:text-[var(--cf-text)]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          {loading ? (
            <EmptyState title="Loading arena..." text="Pulling leaderboard entries." />
          ) : null}

          {!loading && topEntries.length === 0 ? (
            <EmptyState
              title="No entries yet."
              text="Submit verified work to enter this leaderboard."
            />
          ) : null}

          {topEntries.map((entry, index) => (
            <LeaderboardCard
              key={entry.id}
              entry={entry}
              index={index}
              isCurrentUser={current?.id === entry.id}
              topScore={topScore}
            />
          ))}
        </div>

        <aside className="space-y-5">
          <CurrentUserCard entry={current} period={period} />

          <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
            <div className="flex items-center gap-3 text-[var(--cf-accent)]">
              <Shield className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-[0.18em]">
                Arena rules
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <Rule text="Only verified execution should matter." />
              <Rule text="Quiz and exam points should count after backend scoring update." />
              <Rule text="Rejected proof gives pressure, not rank progress." />
              <Rule text="Monthly arena rewards consistency over random bursts." />
            </div>
          </section>

          <section className="rounded-[34px] border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 p-6 shadow-[0_0_28px_var(--cf-glow)]">
            <Sparkles className="h-6 w-6 text-[var(--cf-accent)]" />

            <h3 className="mt-4 text-2xl font-black text-[var(--cf-text)]">
              Next upgrade
            </h3>

            <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
              Connect leaderboard scoring to the unified execution feed, so
              exams, quizzes, practice, and task proofs all shape rank.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

function LeaderboardCard({
  entry,
  index,
  isCurrentUser,
  topScore,
}: {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
  topScore: number;
}) {
  const progress = topScore > 0 ? Math.round((entry.score_points / topScore) * 100) : 0;
  const medal = getMedal(index);

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[34px] border p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] transition-all duration-300",
        isCurrentUser
          ? "border-[var(--cf-primary)]/40 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(17,17,26,0.96))]"
          : "border-[var(--cf-border)] bg-[var(--cf-card)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.15),transparent_36%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className={[
                "flex h-16 w-16 items-center justify-center rounded-3xl border text-xl font-black",
                index === 0
                  ? "border-amber-300/35 bg-amber-300/10 text-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.24)]"
                  : isCurrentUser
                  ? "border-[var(--cf-primary)]/35 bg-[var(--cf-primary)]/12 text-[var(--cf-accent)]"
                  : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)]",
              ].join(" ")}
            >
              {medal}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge text={`Rank #${entry.rank}`} />
                {isCurrentUser ? <Badge text="You" variant="success" /> : null}
              </div>

              <h2 className="mt-3 text-2xl font-black text-[var(--cf-text)]">
                User #{entry.user_id}
              </h2>

              <p className="mt-1 text-sm text-[var(--cf-text-muted)]">
                Updated {formatDate(entry.updated_at)}
              </p>
            </div>
          </div>

          <div className="grid min-w-[240px] grid-cols-2 gap-3">
            <MiniStat label="Points" value={`${entry.score_points}`} />
            <MiniStat label="Verified" value={`${entry.verified_tasks}`} />
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-bold text-[var(--cf-text-muted)]">
            <span>Arena pressure</span>
            <span>{progress}% of top score</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[var(--cf-bg-secondary)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7C5CFF,#A78BFA,#C4B5FD)] transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function CurrentUserCard({
  entry,
  period,
}: {
  entry: LeaderboardEntry | null;
  period: PeriodType;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-primary)]/30 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(17,17,26,0.96))] p-6 shadow-[0_0_32px_var(--cf-glow)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.22),transparent_36%)]" />

      <div className="relative">
        <Crown className="h-7 w-7 text-[var(--cf-accent)]" />

        <h2 className="mt-4 text-2xl font-black text-[var(--cf-text)]">
          Your {format(period)} position
        </h2>

        <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
          {entry
            ? `You are currently ranked #${entry.rank} with ${entry.score_points} points.`
            : "You have not entered this arena yet."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniStat label="Rank" value={entry ? `#${entry.rank}` : "—"} />
          <MiniStat label="Points" value={`${entry?.score_points ?? 0}`} />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
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
        <p className="text-xs font-black uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-black/18 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--cf-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function Rule({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-sm leading-6 text-[var(--cf-text-secondary)]">
      {text}
    </div>
  );
}

function Badge({
  text,
  variant = "default",
}: {
  text: string;
  variant?: "default" | "success";
}) {
  const cls =
    variant === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${cls}`}
    >
      {text}
    </span>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
      <Medal className="h-7 w-7 text-[var(--cf-accent)]" />
      <h2 className="mt-4 text-2xl font-black text-[var(--cf-text)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">{text}</p>
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

function getMedal(index: number) {
  if (index === 0) return <Crown className="h-7 w-7" />;
  if (index === 1) return <Medal className="h-7 w-7" />;
  if (index === 2) return <Trophy className="h-7 w-7" />;
  return `#${index + 1}`;
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}