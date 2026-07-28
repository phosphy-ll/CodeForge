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
  User,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type PeriodType = "daily" | "weekly" | "monthly";

type LeaderboardEntry = {
  id: number;
  user_id: number;
  username?: string | null;
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

  const totalVerified = useMemo(() => {
    return topEntries.reduce((sum, item) => sum + item.verified_tasks, 0);
  }, [topEntries]);

  const topScore = topEntries[0]?.score_points ?? 0;

  return (
    <main className="space-y-6 md:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            Leaderboard
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)] md:text-5xl">
            Execution arena
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cf-text-secondary)]">
            Rank is earned through verified proof, not fake streaks or checkbox
            progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLeaderboard(period)}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={[
              "mr-2 h-4 w-4",
              loading ? "animate-spin" : "",
            ].join(" ")}
          />
          Refresh
        </button>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[linear-gradient(135deg,rgba(17,17,26,0.98),rgba(32,22,58,0.82),rgba(8,8,13,0.98))] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.30)] md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.08),transparent_28%)]" />
        <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.75)]" />

        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <BadgeSoft text={`${format(period)} arena`} />
              <BadgeSoft text={`Starts ${formatDate(data?.period_start)}`} />
              {current ? (
                <BadgeSoft text={`Your rank #${current.rank}`} tone="green" />
              ) : null}
            </div>

            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-[var(--cf-text)] md:text-6xl">
              Proof decides the rank.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)] md:text-base">
              Every verified task pushes your position. No verified proof means
              no arena progress.
            </p>

            <div className="mt-7">
              <LiquidGlassButton
                onClick={() => loadLeaderboard(period)}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh arena"}
                <RefreshCw className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-accent)]">
                  Current position
                </p>

                <p className="mt-3 text-5xl font-black text-[var(--cf-text)]">
                  {current ? `#${current.rank}` : "—"}
                </p>

                <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">
                  {current
                    ? `${current.score_points} points • ${current.verified_tasks} verified`
                    : "You have not entered this arena yet."}
                </p>
              </div>

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 shadow-[0_0_40px_rgba(124,92,255,0.22)]">
                <Trophy className="h-10 w-10 text-[var(--cf-accent)]" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <MiniMetric label="Top score" value={`${topScore}`} />
              <MiniMetric label="Verified" value={`${totalVerified}`} />
              <MiniMetric label="Entries" value={`${topEntries.length}`} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-3 shadow-[0_16px_60px_rgba(0,0,0,0.14)]">
        <div className="grid gap-2 sm:grid-cols-3">
          {PERIODS.map((item) => {
            const active = period === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={[
                  "rounded-2xl border px-5 py-3 text-sm font-black transition-all duration-300",
                  active
                    ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/14 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]"
                    : "border-transparent bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/30 hover:text-[var(--cf-text)]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {loading ? (
            <EmptyState
              title="Loading arena..."
              text="Pulling verified execution entries."
            />
          ) : null}

          {!loading && topEntries.length === 0 ? (
            <EmptyState
              title="No entries yet."
              text="Submit verified work to enter this leaderboard."
            />
          ) : null}

          {!loading && topEntries.length > 0 ? (
            <div className="grid gap-4">
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
          ) : null}
        </div>

        <aside className="space-y-5">
          <CurrentUserCard entry={current} period={period} />

          <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.16)]">
            <div className="flex items-center gap-3 text-[var(--cf-accent)]">
              <Shield className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-[0.18em]">
                Arena rules
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <Rule text="Only verified execution should move rank." />
              <Rule text="Rejected proof gives pressure, not progress." />
              <Rule text="Daily rewards speed. Weekly rewards discipline." />
              <Rule text="Monthly arena rewards consistency over bursts." />
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-primary)]/25 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(17,17,26,0.96))] p-6 shadow-[0_0_32px_var(--cf-glow)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.24),transparent_36%)]" />

            <div className="relative">
              <Sparkles className="h-6 w-6 text-[var(--cf-accent)]" />

              <h3 className="mt-4 text-2xl font-black text-[var(--cf-text)]">
                Next upgrade
              </h3>

              <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
                Connect leaderboard scoring to exams, quizzes, practice, and
                proof submissions through one unified execution feed.
              </p>
            </div>
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
  const progress =
    topScore > 0 ? Math.round((entry.score_points / topScore) * 100) : 0;

  const medal = getMedal(index);
  const displayName = getDisplayName(entry);
  const initials = getInitials(displayName);

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[34px] border p-5 shadow-[0_20px_80px_rgba(0,0,0,0.20)] transition-all duration-300 hover:-translate-y-0.5 md:p-6",
        isCurrentUser
          ? "border-[var(--cf-primary)]/45 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(17,17,26,0.96))]"
          : index < 3
          ? "border-[var(--cf-primary)]/25 bg-[linear-gradient(135deg,rgba(124,92,255,0.10),rgba(17,17,26,0.96))]"
          : "border-[var(--cf-border)] bg-[var(--cf-card)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.15),transparent_36%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={[
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border text-xl font-black",
                index === 0
                  ? "border-amber-300/35 bg-amber-300/10 text-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.24)]"
                  : isCurrentUser
                  ? "border-[var(--cf-primary)]/35 bg-[var(--cf-primary)]/12 text-[var(--cf-accent)]"
                  : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)]",
              ].join(" ")}
            >
              {medal}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge text={`Rank #${entry.rank}`} />
              </div>

              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-sm font-black text-[var(--cf-accent)]">
                  {initials || <User className="h-5 w-5" />}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-black leading-tight text-[var(--cf-text)]">
                    {displayName}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--cf-text-muted)]">
                      ID {entry.user_id}
                    </span>

                    {isCurrentUser ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
                        You
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[260px]">
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

        <p className="mt-4 text-xs text-[var(--cf-text-muted)]">
          Updated {formatDate(entry.updated_at)}
        </p>
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
  const displayName = entry ? getDisplayName(entry) : "Not ranked yet";

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
            ? `${displayName} is ranked #${entry.rank} with ${entry.score_points} points.`
            : "You have not entered this arena yet."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniStat label="Rank" value={entry ? `#${entry.rank}` : "—"} />
          <MiniStat label="Points" value={`${entry?.score_points ?? 0}`} />
        </div>

        {entry ? (
          <div className="mt-3">
            <MiniStat label="User ID" value={`${entry.user_id}`} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
      <p className="text-[11px] text-[var(--cf-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--cf-text)]">{value}</p>
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

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--cf-accent)]">
      {text}
    </span>
  );
}

function BadgeSoft({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "green" | "amber" | "rose";
}) {
  const cls =
    tone === "green"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : tone === "amber"
      ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
      : tone === "rose"
      ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
      : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]";

  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
        cls,
      ].join(" ")}
    >
      {text}
    </span>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8 shadow-[0_16px_60px_rgba(0,0,0,0.14)]">
      <Medal className="h-7 w-7 text-[var(--cf-accent)]" />
      <h2 className="mt-4 text-2xl font-black text-[var(--cf-text)]">
        {title}
      </h2>
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

function getDisplayName(entry: LeaderboardEntry) {
  const username = entry.username?.trim();

  if (!username) return `User #${entry.user_id}`;

  if (username.length > 15) {
    return `${username.slice(0, 15)}...`;
  }

  return username;
}

function getInitials(name: string) {
  if (!name || name.startsWith("User #")) return "";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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