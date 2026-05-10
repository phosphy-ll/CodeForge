"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Flame,
  Gauge,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";
import StreakProgressBar from "@/components/ui/streak-progress-bar";

type Goal = {
  goal_id: number;
  title: string;
  status: string;
  today_plan_task_count: number;
};

type TodayTask = {
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

type TodayPlan = {
  id: number;
  user_id: number;
  goal_id: number;
  plan_date: string;
  source: string;
  replace_used_count: number;
  regenerate_used: boolean;
  is_locked: boolean;
  created_at: string;
  tasks: TodayTask[];
  can_replace_task_today: boolean;
  can_regenerate_today: boolean;
};

type DashboardData = {
  earned_points_today: number;
  required_points_today: number;
  progress_percent: number;
  bonus_streak_eligible: boolean;
  extra_streak_already_earned_today: boolean;
  current_streak: number;
  best_streak: number;
  rank: string | null;
  subscription_tier: string;
  daily_task_limit: number;
  ai_level: string;
  active_goals: Goal[];
  selected_goal: Goal | null;
  today_plans: TodayPlan | null;
  penalty_active: boolean;
  recovery_active: boolean;
};

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);

      const res = await api.get("/me/dashboard");
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const plan = data?.today_plans ?? null;
    const tasks = plan?.tasks ?? [];

    const activeTasks = tasks.filter((task) =>
      ["available", "in_progress", "needs_revision", "failed", "submitted"].includes(
        task.status || ""
      )
    );

    const verifiedTasks = tasks.filter((task) => task.status === "verified");

    const nextTask =
      activeTasks.find((task) => task.is_required) || activeTasks[0] || null;

    const missingPoints = Math.max(
      (data?.required_points_today ?? 100) - (data?.earned_points_today ?? 0),
      0
    );

    const state =
      !data?.active_goals?.length
        ? "no_goal"
        : !plan
        ? "no_plan"
        : missingPoints > 0
        ? "behind"
        : "secured";

    return {
      plan,
      tasks,
      activeTasks,
      verifiedTasks,
      nextTask,
      missingPoints,
      state,
    };
  }, [data]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <main className="space-y-6">
        <Header />
        <section className="rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
          <h2 className="text-2xl font-black text-[var(--cf-text)]">
            Dashboard failed to load.
          </h2>
          <p className="mt-3 text-sm text-[var(--cf-text-secondary)]">
            Reload the command center. Execution does not wait.
          </p>
          <div className="mt-6">
            <LiquidGlassButton onClick={loadDashboard}>Reload</LiquidGlassButton>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <Header />

      <section className="relative overflow-hidden rounded-[36px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
              Command center
            </p>

            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-[var(--cf-text)]">
              {getHeroTitle(stats.state)}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {getHeroText(stats.state, stats.missingPoints)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <LiquidGlassButton onClick={() => router.push("/today")}>
                Open Today <ArrowRight className="ml-2 h-4 w-4" />
              </LiquidGlassButton>

              <button
                onClick={() => router.push("/ai-coach")}
                className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
              >
                AI Coach
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Metric label="Today" value={`${data.earned_points_today}`} />
            <Metric label="Required" value={`${data.required_points_today}`} />
            <Metric label="Missing" value={`${stats.missingPoints}`} />
          </div>
        </div>

        <div className="relative mt-8">
          <StreakProgressBar current={data.earned_points_today} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          title="Current streak"
          value={String(data.current_streak)}
          sub={`Best: ${data.best_streak}`}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          title="Rank"
          value={format(data.rank) || "No rank"}
          sub="Current execution tier"
        />
        <StatCard
          icon={<Brain className="h-5 w-5" />}
          title="AI level"
          value={format(data.ai_level)}
          sub={`${format(data.subscription_tier)} plan`}
        />
        <StatCard
          icon={<Gauge className="h-5 w-5" />}
          title="Daily limit"
          value={String(data.daily_task_limit)}
          sub="Max task load"
        />
      </section>

      {(data.penalty_active || data.recovery_active) ? (
        <section className="rounded-[32px] border border-amber-500/25 bg-amber-500/10 p-6">
          <div className="flex items-start gap-4">
            <ShieldAlert className="mt-1 h-6 w-6 text-amber-300" />
            <div>
              <h2 className="text-xl font-black text-[var(--cf-text)]">
                Execution pressure active
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--cf-text-secondary)]">
                Penalty or recovery mode is active. Clear the debt before you
                expect smooth progress.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-[var(--cf-accent)]" />
                <h2 className="text-2xl font-black text-[var(--cf-text)]">
                  Next execution
                </h2>
              </div>

              {stats.nextTask ? (
                <>
                  <h3 className="mt-5 text-3xl font-black text-[var(--cf-text)]">
                    {stats.nextTask.title || "Untitled task"}
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
                    {stats.nextTask.description ||
                      "Open the next task, submit proof, and move."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Info label="Slot" value={format(stats.nextTask.slot)} />
                    <Info
                      label="Reward"
                      value={`${stats.nextTask.reward_points || 0} pts`}
                    />
                    <Info
                      label="Time"
                      value={
                        stats.nextTask.estimated_minutes
                          ? `${stats.nextTask.estimated_minutes} min`
                          : "—"
                      }
                    />
                  </div>

                  <div className="mt-6">
                    <LiquidGlassButton
                      onClick={() => router.push(`/tasks/${stats.nextTask?.task_id}`)}
                    >
                      Start task <ArrowRight className="ml-2 h-4 w-4" />
                    </LiquidGlassButton>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mt-5 text-3xl font-black text-[var(--cf-text)]">
                    No task selected.
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
                    Open Today to generate or inspect the current execution plan.
                  </p>
                  <div className="mt-6">
                    <LiquidGlassButton onClick={() => router.push("/today")}>
                      Open Today
                    </LiquidGlassButton>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-[var(--cf-accent)]" />
            <h2 className="text-2xl font-black text-[var(--cf-text)]">
              Daily status
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            <StatusRow
              label="Plan"
              value={stats.plan ? "Ready" : "Missing"}
              good={Boolean(stats.plan)}
            />
            <StatusRow
              label="Required points"
              value={`${data.required_points_today}`}
              good
            />
            <StatusRow
              label="Verified tasks"
              value={`${stats.verifiedTasks.length}/${stats.tasks.length}`}
              good={stats.missingPoints === 0}
            />
            <StatusRow
              label="Bonus eligible"
              value={data.bonus_streak_eligible ? "Yes" : "No"}
              good={data.bonus_streak_eligible}
            />
          </div>
        </section>
      </section>

      {data.selected_goal ? (
        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-text-muted)]">
                Selected goal
              </p>

              <h2 className="mt-3 text-3xl font-black text-[var(--cf-text)]">
                {data.selected_goal.title}
              </h2>

              <p className="mt-3 text-sm text-[var(--cf-text-secondary)]">
                {format(data.selected_goal.status)} • Today tasks:{" "}
                {data.selected_goal.today_plan_task_count}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/roadmap")}
                className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
              >
                Open roadmap
              </button>

              <button
                onClick={() => router.push("/tasks")}
                className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
              >
                Browse tasks
              </button>
            </div>
          </div>

          {data.active_goals.length > 1 ? (
            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {data.active_goals.map((goal) => (
                <div
                  key={goal.goal_id}
                  className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4"
                >
                  <p className="font-black text-[var(--cf-text)]">{goal.title}</p>
                  <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">
                    {format(goal.status)} • Tasks today: {goal.today_plan_task_count}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
          <Rocket className="h-8 w-8 text-[var(--cf-accent)]" />
          <h2 className="mt-4 text-3xl font-black text-[var(--cf-text)]">
            No goal yet.
          </h2>
          <p className="mt-3 text-sm text-[var(--cf-text-secondary)]">
            Create a goal before CodeForge can generate execution pressure.
          </p>
          <div className="mt-6">
            <LiquidGlassButton onClick={() => router.push("/roadmap")}>
              Create goal
            </LiquidGlassButton>
          </div>
        </section>
      )}
    </main>
  );
}

function Header() {
  return (
    <header>
      <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
        Dashboard
      </p>
      <h1 className="mt-2 text-4xl font-black text-[var(--cf-text)]">
        Execution overview
      </h1>
    </header>
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

function StatCard({
  icon,
  title,
  value,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]">
        {icon}
      </div>
      <p className="mt-5 text-sm text-[var(--cf-text-muted)]">{title}</p>
      <p className="mt-2 text-3xl font-black text-[var(--cf-text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">{sub}</p>
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

function StatusRow({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
      <div className="flex items-center gap-3">
        {good ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-300" />
        )}
        <p className="text-sm font-bold text-[var(--cf-text-secondary)]">
          {label}
        </p>
      </div>
      <p className="text-sm font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-64 animate-pulse rounded-2xl bg-[var(--cf-card)]" />
      <div className="h-72 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-44 animate-pulse rounded-[30px] bg-[var(--cf-card)]" />
        <div className="h-44 animate-pulse rounded-[30px] bg-[var(--cf-card)]" />
        <div className="h-44 animate-pulse rounded-[30px] bg-[var(--cf-card)]" />
        <div className="h-44 animate-pulse rounded-[30px] bg-[var(--cf-card)]" />
      </div>
    </div>
  );
}

function getHeroTitle(state: string) {
  if (state === "no_goal") return "No goal. No execution.";
  if (state === "no_plan") return "Daily plan missing.";
  if (state === "secured") return "Daily proof secured.";
  return "You are behind today.";
}

function getHeroText(state: string, missingPoints: number) {
  if (state === "no_goal") {
    return "Create a goal before the system can push you forward.";
  }

  if (state === "no_plan") {
    return "Open Today and generate your execution chain.";
  }

  if (state === "secured") {
    return "You hit the required verified points. Bonus progress still compounds.";
  }

  return `You still need ${missingPoints} verified points. Open Today and submit proof before momentum drops.`;
}

function format(v?: string | null) {
  if (!v) return "";
  return v
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}