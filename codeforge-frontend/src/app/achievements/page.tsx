"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Flame,
  Lock,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";

import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type Achievement = {
  id: number;
  key: string;
  title: string;
  description: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  icon: string | null;
  is_active: boolean;
  created_at: string;
};

type UserAchievement = {
  id: number;
  user_id: number;
  achievement_id: number;
  progress_value: number;
  is_completed: boolean;
  unlocked_at: string | null;
};

const CATEGORIES = ["all", "execution", "streak", "quiz", "exam", "practice", "project"];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAchievements() {
    try {
      setLoading(true);
      setError("");

      const [allRes, myRes] = await Promise.all([
        api.get<Achievement[]>("/achievements"),
        api.get<UserAchievement[]>("/achievements/me"),
      ]);

      setAchievements(allRes.data);
      setUserAchievements(myRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load achievements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAchievements();
  }, []);

  const merged = useMemo(() => {
    return achievements.map((achievement) => {
      const userAchievement = userAchievements.find(
        (item) => item.achievement_id === achievement.id
      );

      const progress = userAchievement?.progress_value ?? 0;
      const required = achievement.requirement_value || 1;
      const progressPercent = Math.min(100, Math.round((progress / required) * 100));

      return {
        ...achievement,
        progress_value: progress,
        progress_percent: progressPercent,
        is_completed: userAchievement?.is_completed ?? false,
        unlocked_at: userAchievement?.unlocked_at ?? null,
      };
    });
  }, [achievements, userAchievements]);

  const filtered = useMemo(() => {
    if (category === "all") return merged;
    return merged.filter((item) => item.category === category);
  }, [merged, category]);

  const completedCount = merged.filter((item) => item.is_completed).length;
  const totalCount = merged.length;
  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Achievements
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
          Proof trophies
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Achievements track real execution: verified proof, streak discipline,
          exams, quizzes, practice drills, and project completion.
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
                Trophy room
              </p>
            </div>

            <h2 className="mt-4 text-5xl font-black text-[var(--cf-text)]">
              {completionPercent}%
            </h2>

            <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
              {completedCount}/{totalCount} achievements unlocked. Keep stacking
              proof to complete the collection.
            </p>
          </div>

          <LiquidGlassButton onClick={loadAchievements} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
            <RefreshCw className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>

        <div className="relative mt-7 grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Unlocked"
            value={`${completedCount}`}
          />
          <MetricCard
            icon={<Lock className="h-5 w-5" />}
            label="Locked"
            value={`${Math.max(totalCount - completedCount, 0)}`}
          />
          <MetricCard
            icon={<Flame className="h-5 w-5" />}
            label="Completion"
            value={`${completionPercent}%`}
          />
        </div>

        <div className="relative mt-7 h-4 overflow-hidden rounded-full bg-[var(--cf-bg-secondary)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7C5CFF,#A78BFA,#C4B5FD)] transition-all duration-700"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-4">
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((item) => {
            const active = category === item;

            return (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={[
                  "rounded-2xl border px-4 py-2 text-sm font-bold transition-all duration-300",
                  active
                    ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/14 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]"
                    : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/30 hover:text-[var(--cf-text)]",
                ].join(" ")}
              >
                {format(item)}
              </button>
            );
          })}
        </div>
      </section>

      {loading ? (
        <EmptyState title="Loading achievements..." text="Checking your proof trophies." />
      ) : null}

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No achievements here." text="Try another category." />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        {filtered.map((item) => (
          <AchievementCard key={item.id} item={item} />
        ))}
      </section>
    </main>
  );
}

function AchievementCard({
  item,
}: {
  item: Achievement & {
    progress_value: number;
    progress_percent: number;
    is_completed: boolean;
    unlocked_at: string | null;
  };
}) {
  const icon = getIcon(item.category);

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[34px] border p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] transition-all duration-300",
        item.is_completed
          ? "border-[var(--cf-primary)]/35 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(17,17,26,0.96))]"
          : "border-[var(--cf-border)] bg-[var(--cf-card)] opacity-75",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.16),transparent_34%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className={[
                "flex h-14 w-14 items-center justify-center rounded-2xl border",
                item.is_completed
                  ? "border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/12 text-[var(--cf-accent)] shadow-[0_0_26px_var(--cf-glow)]"
                  : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-muted)]",
              ].join(" ")}
            >
              {icon}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge text={format(item.category)} />
                {item.is_completed ? (
                  <Badge text="Unlocked" variant="success" />
                ) : (
                  <Badge text="Locked" variant="muted" />
                )}
              </div>

              <h2 className="mt-3 text-2xl font-black text-[var(--cf-text)]">
                {item.title}
              </h2>
            </div>
          </div>

          {item.is_completed ? (
            <Sparkles className="h-5 w-5 text-[var(--cf-accent)]" />
          ) : (
            <Lock className="h-5 w-5 text-[var(--cf-text-muted)]" />
          )}
        </div>

        <p className="mt-5 text-sm leading-7 text-[var(--cf-text-secondary)]">
          {item.description}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Detail label="Progress" value={`${item.progress_value}/${item.requirement_value}`} />
          <Detail label="Type" value={format(item.requirement_type)} />
          <Detail
            label="Unlocked"
            value={item.unlocked_at ? formatDate(item.unlocked_at) : "—"}
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-bold text-[var(--cf-text-muted)]">
            <span>Progress</span>
            <span>{item.progress_percent}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[var(--cf-bg-secondary)]">
            <div
              className={[
                "h-full rounded-full transition-all duration-700",
                item.is_completed
                  ? "bg-[linear-gradient(90deg,#7C5CFF,#A78BFA,#C4B5FD)]"
                  : "bg-[rgba(124,92,255,0.35)]",
              ].join(" ")}
              style={{ width: `${item.progress_percent}%` }}
            />
          </div>
        </div>
      </div>
    </article>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-black/15 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--cf-text-muted)]">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-black text-[var(--cf-text)]">
        {value}
      </p>
    </div>
  );
}

function Badge({
  text,
  variant = "default",
}: {
  text: string;
  variant?: "default" | "success" | "muted";
}) {
  const cls =
    variant === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : variant === "muted"
      ? "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-muted)]"
      : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${cls}`}>
      {text}
    </span>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
      <Award className="h-7 w-7 text-[var(--cf-accent)]" />
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

function getIcon(category: string) {
  if (category === "streak") return <Flame className="h-6 w-6" />;
  if (category === "exam") return <Trophy className="h-6 w-6" />;
  if (category === "quiz") return <BrainIcon />;
  if (category === "practice") return <Medal className="h-6 w-6" />;
  if (category === "project") return <CheckCircle2 className="h-6 w-6" />;
  return <Award className="h-6 w-6" />;
}

function BrainIcon() {
  return <Sparkles className="h-6 w-6" />;
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}