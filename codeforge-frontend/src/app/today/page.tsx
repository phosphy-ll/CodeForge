"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  RefreshCw,
  ShieldAlert,
  Target,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";
import StreakProgressBar from "@/components/ui/streak-progress-bar";

type DailyPlanTask = {
  id: number;
  daily_plan_id: number;
  task_id: number;
  order: number;
  slot?: "learn" | "practice" | "build" | "task";
  is_required: boolean;
  title: string | null;
  description: string | null;
  status: string | null;
  task_type: string | null;
  verification_type: string | null;
  skill_tag: string | null;
  difficulty: number | null;
  estimated_minutes: number | null;
  reward_points: number | null;
  required_score: number | null;
};

type DailyPlan = {
  id: number;
  user_id: number;
  goal_id: number;
  plan_date: string;
  source: string;
  replace_used_count: number;
  regenerate_used: boolean;
  is_locked: boolean;
  created_at: string;
  tasks: DailyPlanTask[];
  can_replace_task_today: boolean;
  can_regenerate_today: boolean;
  earned_points_today: number;
  required_points_today: number;
};

export default function TodayPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadPlan() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/daily-plans/today");
      setPlan(response.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load daily plan.");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  async function regeneratePlan() {
    if (!plan || !plan.can_regenerate_today) return;

    try {
      setRegenerating(true);
      setError("");

      const response = await api.post(`/daily-plans/${plan.id}/regenerate`);
      setPlan(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to regenerate plan.");
    } finally {
      setRegenerating(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, []);

  const stats = useMemo(() => {
    const tasks = plan?.tasks || [];

    const totalPoints = tasks.reduce(
      (sum, task) => sum + (task.reward_points || 0),
      0
    );

    const verifiedPoints = plan?.earned_points_today || 0;
    const requiredPoints = plan?.required_points_today || 100;

    const verifiedTasks = tasks.filter((task) => task.status === "verified");
    const activeTasks = tasks.filter((task) =>
      ["available", "in_progress", "needs_revision", "failed", "submitted"].includes(
        task.status || ""
      )
    );

    const topTask =
      activeTasks.find((task) => task.is_required) || activeTasks[0] || null;

    const progress = totalPoints
      ? Math.min(Math.round((verifiedPoints / totalPoints) * 100), 100)
      : 0;

    const missingPoints = Math.max(requiredPoints - verifiedPoints, 0);

    return {
      totalPoints,
      verifiedPoints,
      verifiedTasks,
      activeTasks,
      topTask,
      progress,
      requiredPoints,
      missingPoints,
    };
  }, [plan]);

  if (loading) {
    return <TodaySkeleton />;
  }

  if (!plan) {
    return (
      <main className="space-y-6">
        <Header />
        <section className="rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
          <h2 className="text-2xl font-black text-[var(--cf-text)]">
            No execution plan.
          </h2>
          <p className="mt-3 text-sm text-[var(--cf-text-secondary)]">
            CodeForge could not load today’s plan. Try again.
          </p>
          {error ? <ErrorBox text={error} /> : null}
          <div className="mt-6">
            <LiquidGlassButton onClick={loadPlan}>Reload plan</LiquidGlassButton>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <Header />

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.16),transparent_35%)]" />

        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
              Today’s execution plan
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[var(--cf-text)]">
              Execute the plan. No proof, no progress.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              This plan is generated by CodeForge for today. Finish the required
              chain: learn → practice → build.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Metric label="Verified" value={`${stats.verifiedPoints}`} />
            <Metric label="Required" value={`${stats.requiredPoints}`} />
            <Metric label="Missing" value={`${stats.missingPoints}`} />
          </div>
        </div>

        <div className="relative mt-7">
          <StreakProgressBar current={stats.verifiedPoints} />
        </div>
      </section>

      <section
        className={[
          "rounded-[32px] border p-6",
          stats.missingPoints > 0
            ? "border-amber-500/20 bg-amber-500/8"
            : "border-emerald-500/20 bg-emerald-500/8",
        ].join(" ")}
      >
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-3">
            {stats.missingPoints > 0 ? (
              <ShieldAlert className="h-6 w-6 text-amber-300" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-black text-[var(--cf-text)]">
              {stats.missingPoints > 0
                ? "Pressure active"
                : "Daily proof secured"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {stats.missingPoints > 0
                ? `You still need ${stats.missingPoints} verified points. Open the next task, submit proof, and stop bleeding time.`
                : "You secured the required points. Bonus progress still counts toward stronger momentum."}
            </p>
          </div>
        </div>
      </section>

      {stats.topTask ? (
        <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-primary)]/35 bg-[var(--cf-primary)]/10 p-7 shadow-[0_0_44px_var(--cf-glow)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-[var(--cf-accent)]" />
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
                Start here
              </p>
            </div>

            <h2 className="mt-4 text-3xl font-black text-[var(--cf-text)]">
              {stats.topTask.title || "Untitled task"}
            </h2>

            <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {stats.topTask.description ||
                "Open this task, complete the required proof, and submit it for verification."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Info label="Slot" value={format(stats.topTask.slot)} />
              <Info label="Reward" value={`${stats.topTask.reward_points || 0} pts`} />
              <Info
                label="Time"
                value={
                  stats.topTask.estimated_minutes
                    ? `${stats.topTask.estimated_minutes} min`
                    : "—"
                }
              />
              <Info
                label="Difficulty"
                value={
                  stats.topTask.difficulty ? `${stats.topTask.difficulty}/5` : "—"
                }
              />
            </div>

            <div className="mt-6">
              <LiquidGlassButton
                onClick={() => router.push(`/tasks/${stats.topTask?.task_id}`)}
              >
                Start execution <ArrowRight className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/10 p-7">
          <h2 className="text-2xl font-black text-emerald-300">
            No executable tasks left.
          </h2>
          <p className="mt-3 text-sm text-[var(--cf-text-secondary)]">
            Everything is verified or waiting for review.
          </p>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-black text-[var(--cf-text)]">
              Execution chain
            </h2>
            <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">
              Complete in order. The system cares about proof, not intention.
            </p>
          </div>

          {plan.tasks.length === 0 ? (
            <EmptyCard text="No tasks inside today’s plan." />
          ) : (
            plan.tasks.map((task) => (
              <DailyTaskCard
                key={task.id}
                task={task}
                onOpen={() => router.push(`/tasks/${task.task_id}`)}
              />
            ))
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-[var(--cf-accent)]" />
              <h3 className="text-xl font-black text-[var(--cf-text)]">
                AI pressure
              </h3>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--cf-text-secondary)]">
              If your proof is vague, it will not count. Submit code,
              explanation, and reasoning. The system does not reward empty
              checkboxes.
            </p>

            <button
              onClick={() => router.push("/ai-coach")}
              className="mt-5 rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-5 py-3 text-sm font-bold text-[var(--cf-accent)] transition hover:bg-[var(--cf-primary)]/18"
            >
              Open AI Coach
            </button>
          </section>

          <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-[var(--cf-accent)]" />
              <h3 className="text-xl font-black text-[var(--cf-text)]">
                Plan control
              </h3>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--cf-text-secondary)]">
              Regenerate only if the plan is wrong. Do not use this to dodge
              hard work.
            </p>

            <div className="mt-5">
              <LiquidGlassButton
                onClick={regeneratePlan}
                disabled={!plan.can_regenerate_today || regenerating}
              >
                {regenerating ? "Regenerating..." : "Regenerate plan"}
              </LiquidGlassButton>
            </div>

            <p className="mt-4 text-xs text-[var(--cf-text-muted)]">
              {plan.can_regenerate_today
                ? "Available once today."
                : "Regeneration already used or plan locked."}
            </p>
          </section>

          <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-[var(--cf-accent)]" />
              <h3 className="text-xl font-black text-[var(--cf-text)]">
                Verified today
              </h3>
            </div>

            <p className="mt-4 text-4xl font-black text-[var(--cf-text)]">
              {stats.verifiedTasks.length}/{plan.tasks.length}
            </p>

            <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">
              Tasks verified. Keep going until today’s required points are
              secured.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header>
      <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
        Execution
      </p>
      <h1 className="mt-2 text-4xl font-black text-[var(--cf-text)]">Today</h1>
    </header>
  );
}

function DailyTaskCard({
  task,
  onOpen,
}: {
  task: DailyPlanTask;
  onOpen: () => void;
}) {
  const verified = task.status === "verified";
  const submitted = task.status === "submitted";
  const needsRevision = task.status === "needs_revision" || task.status === "failed";

  return (
    <article
      className={[
        "group rounded-[30px] border bg-[var(--cf-card)] p-5 transition-all duration-300",
        verified
          ? "border-emerald-500/20 bg-emerald-500/8"
          : needsRevision
          ? "border-amber-500/25 bg-amber-500/8"
          : submitted
          ? "border-cyan-500/20 bg-cyan-500/8"
          : "border-[var(--cf-border)] hover:border-[var(--cf-primary)]/35 hover:shadow-[0_18px_50px_var(--cf-glow)]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SlotBadge slot={task.slot || "task"} />
            <StatusBadge status={task.status || "available"} />
            {task.is_required ? <SmallBadge>Required</SmallBadge> : null}
          </div>

          <h3 className="mt-3 text-xl font-black text-[var(--cf-text)]">
            {task.title || "Untitled task"}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--cf-text-secondary)]">
            {task.description || "No description."}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
          <Info label="Points" value={`${task.reward_points || 0}`} />
          <Info
            label="Time"
            value={task.estimated_minutes ? `${task.estimated_minutes}m` : "—"}
          />

          <button
            onClick={onOpen}
            className="rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-5 py-3 text-sm font-black text-[var(--cf-accent)] transition hover:bg-[var(--cf-primary)]/18"
          >
            {getActionLabel(task.status || "available")}
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[110px] rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3">
      <p className="text-xs text-[var(--cf-text-muted)]">{label}</p>
      <p className="mt-1 text-xl font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3">
      <p className="text-[11px] text-[var(--cf-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function SlotBadge({ slot }: { slot: string }) {
  const icon =
    slot === "learn" ? (
      <Brain className="h-3.5 w-3.5" />
    ) : slot === "practice" ? (
      <Target className="h-3.5 w-3.5" />
    ) : slot === "build" ? (
      <Zap className="h-3.5 w-3.5" />
    ) : (
      <Clock className="h-3.5 w-3.5" />
    );

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-3 py-1 text-xs font-bold text-[var(--cf-accent)]">
      {icon}
      {format(slot)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "verified"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : status === "needs_revision" || status === "failed"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
      : status === "submitted"
      ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
      : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${className}`}>
      {format(status)}
    </span>
  );
}

function SmallBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-3 py-1 text-xs font-bold text-[var(--cf-text-secondary)]">
      {children}
    </span>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 text-sm text-[var(--cf-text-secondary)]">
      {text}
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

function TodaySkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-56 animate-pulse rounded-2xl bg-[var(--cf-card)]" />
      <div className="h-56 animate-pulse rounded-[34px] bg-[var(--cf-card)]" />
      <div className="h-40 animate-pulse rounded-[34px] bg-[var(--cf-card)]" />
      <div className="h-72 animate-pulse rounded-[34px] bg-[var(--cf-card)]" />
    </div>
  );
}

function getActionLabel(status: string) {
  if (status === "verified") return "View result";
  if (status === "submitted") return "Review status";
  if (status === "needs_revision") return "Revise proof";
  if (status === "failed") return "Retry";
  return "Open";
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}