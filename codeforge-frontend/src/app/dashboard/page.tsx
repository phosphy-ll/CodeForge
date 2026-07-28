"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  Layers3,
  Play,
  RefreshCw,
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

type DashboardState = "no_goal" | "no_plan" | "behind" | "secured";

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/me/dashboard");
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const plan = data?.today_plans ?? null;
    const tasks = plan?.tasks ?? [];

    const actionableTasks = tasks.filter((task) =>
      ["available", "in_progress", "needs_revision", "failed", "submitted"].includes(
        task.status || ""
      )
    );

    const verifiedTasks = tasks.filter((task) => task.status === "verified");

    const nextTask =
      actionableTasks.find((task) => task.is_required) ||
      actionableTasks[0] ||
      null;

    const missingPoints = Math.max(
      (data?.required_points_today ?? 100) - (data?.earned_points_today ?? 0),
      0
    );

    const progressPercent = Math.min(
      Math.round(data?.progress_percent ?? 0),
      100
    );

    const state: DashboardState =
      !data?.active_goals?.length
        ? "no_goal"
        : !plan
        ? "no_plan"
        : missingPoints > 0
        ? "behind"
        : "secured";

    const estimatedMinutesLeft = actionableTasks.reduce(
      (sum, task) => sum + (task.estimated_minutes || 0),
      0
    );

    return {
      plan,
      tasks,
      actionableTasks,
      verifiedTasks,
      nextTask,
      missingPoints,
      progressPercent,
      state,
      estimatedMinutesLeft,
    };
  }, [data]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <main className="space-y-6">
        <Header refreshing={refreshing} onRefresh={() => loadDashboard(true)} />

        <section className="relative overflow-hidden rounded-[34px] border border-rose-400/20 bg-rose-500/10 p-8 shadow-[0_0_60px_rgba(244,63,94,0.10)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.14),transparent_34%)]" />

          <div className="relative">
            <AlertTriangle className="h-8 w-8 text-rose-200" />

            <h2 className="mt-4 text-3xl font-black text-[var(--cf-text)]">
              Dashboard failed to load.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              The command center lost sync. Reload it and continue execution.
            </p>

            <div className="mt-6">
              <LiquidGlassButton onClick={() => loadDashboard()}>
                Reload dashboard
                <RefreshCw className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main data-tour="dashboard-main" className="space-y-6 md:space-y-8">
      <Header refreshing={refreshing} onRefresh={() => loadDashboard(true)} />

      <HeroPanel
        data={data}
        state={stats.state}
        missingPoints={stats.missingPoints}
        progressPercent={stats.progressPercent}
        nextTask={stats.nextTask}
        onOpenToday={() => router.push("/today")}
        onOpenCoach={() => router.push("/ai-coach")}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          title="Current streak"
          value={String(data.current_streak)}
          sub={`Best streak: ${data.best_streak}`}
          tone="hot"
        />

        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          title="Rank"
          value={format(data.rank) || "No rank"}
          sub="Execution position"
          tone="gold"
        />

        <StatCard
          icon={<Brain className="h-5 w-5" />}
          title="AI level"
          value={format(data.ai_level)}
          sub={`${format(data.subscription_tier)} plan`}
          tone="purple"
        />

        <StatCard
          icon={<Gauge className="h-5 w-5" />}
          title="Daily capacity"
          value={String(data.daily_task_limit)}
          sub="Maximum task load"
          tone="default"
        />
      </section>

      {(data.penalty_active || data.recovery_active) ? (
        <PressureBanner
          penaltyActive={data.penalty_active}
          recoveryActive={data.recovery_active}
          onOpenToday={() => router.push("/today")}
        />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <NextExecutionCard
          nextTask={stats.nextTask}
          state={stats.state}
          onOpenToday={() => router.push("/today")}
          onOpenTask={(taskId) => router.push(`/tasks/${taskId}`)}
          onCreateGoal={() => router.push("/roadmap")}
        />

        <DailyStatusCard
          data={data}
          plan={stats.plan}
          tasks={stats.tasks}
          verifiedCount={stats.verifiedTasks.length}
          missingPoints={stats.missingPoints}
          estimatedMinutesLeft={stats.estimatedMinutesLeft}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GoalCard
          selectedGoal={data.selected_goal}
          activeGoals={data.active_goals}
          onOpenRoadmap={() => router.push("/roadmap")}
          onOpenTasks={() => router.push("/tasks")}
        />

        <ExecutionChainCard
          tasks={stats.tasks}
          onOpenTask={(taskId) => router.push(`/tasks/${taskId}`)}
          onOpenToday={() => router.push("/today")}
        />
      </section>
    </main>
  );
}

function Header({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Dashboard
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)] md:text-5xl">
          Execution overview
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cf-text-secondary)]">
          Your daily pressure, proof progress, and next move in one place.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          className={[
            "mr-2 h-4 w-4",
            refreshing ? "animate-spin" : "",
          ].join(" ")}
        />
        Refresh
      </button>
    </header>
  );
}

function HeroPanel({
  data,
  state,
  missingPoints,
  progressPercent,
  nextTask,
  onOpenToday,
  onOpenCoach,
}: {
  data: DashboardData;
  state: DashboardState;
  missingPoints: number;
  progressPercent: number;
  nextTask: TodayTask | null;
  onOpenToday: () => void;
  onOpenCoach: () => void;
}) {
  const secured = state === "secured";

  return (
    <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[linear-gradient(135deg,rgba(17,17,26,0.98),rgba(32,22,58,0.82),rgba(8,8,13,0.98))] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.30)] md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.75)]" />

      <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
        <div>
          <div className="flex flex-wrap gap-2">
            <BadgeSoft text={getStateBadge(state)} tone={secured ? "green" : "purple"} />

            {data.recovery_active ? (
              <BadgeSoft text="Recovery active" tone="amber" />
            ) : null}

            {data.penalty_active ? (
              <BadgeSoft text="Penalty active" tone="rose" />
            ) : null}
          </div>

          <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-[var(--cf-text)] md:text-6xl">
            {getHeroTitle(state)}
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)] md:text-base">
            {getHeroText(state, missingPoints)}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <LiquidGlassButton onClick={onOpenToday}>
              {state === "no_goal" ? "Create goal" : "Open Today"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </LiquidGlassButton>

            <button
              type="button"
              onClick={onOpenCoach}
              className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)]"
            >
              AI Coach
            </button>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-accent)]">
                Daily proof
              </p>

              <p className="mt-3 text-5xl font-black text-[var(--cf-text)]">
                {progressPercent}%
              </p>

              <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">
                {data.earned_points_today}/{data.required_points_today} verified points
              </p>
            </div>

            <ProgressOrb progress={progressPercent} />
          </div>

          <div className="mt-6">
            <StreakProgressBar current={data.earned_points_today} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniMetric label="Missing" value={String(missingPoints)} />
            <MiniMetric
              label="Next"
              value={nextTask?.reward_points ? `${nextTask.reward_points}` : "—"}
            />
            <MiniMetric
              label="Bonus"
              value={data.bonus_streak_eligible ? "Yes" : "No"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PressureBanner({
  penaltyActive,
  recoveryActive,
  onOpenToday,
}: {
  penaltyActive: boolean;
  recoveryActive: boolean;
  onOpenToday: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-amber-400/25 bg-amber-400/10 p-6 shadow-[0_0_50px_rgba(251,191,36,0.10)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_34%)]" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-amber-300" />

          <div>
            <h2 className="text-xl font-black text-[var(--cf-text)]">
              Execution pressure active
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {penaltyActive && recoveryActive
                ? "Penalty and recovery mode are active. Clear today’s required proof before stacking new progress."
                : recoveryActive
                ? "Recovery mode is active. Finish the recovery chain to stabilize your streak."
                : "Penalty mode is active. Submit verified proof today to reduce execution debt."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenToday}
          className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-300/15"
        >
          Clear pressure
        </button>
      </div>
    </section>
  );
}

function NextExecutionCard({
  nextTask,
  state,
  onOpenToday,
  onOpenTask,
  onCreateGoal,
}: {
  nextTask: TodayTask | null;
  state: DashboardState;
  onOpenToday: () => void;
  onOpenTask: (taskId: number) => void;
  onCreateGoal: () => void;
}) {
  if (state === "no_goal") {
    return (
      <EmptyActionCard
        icon={<Rocket className="h-7 w-7" />}
        eyebrow="Start here"
        title="Create your first execution path."
        text="CodeForge needs one active goal before it can generate roadmaps, daily pressure, and proof-based tasks."
        action="Create goal"
        onAction={onCreateGoal}
      />
    );
  }

  if (state === "no_plan") {
    return (
      <EmptyActionCard
        icon={<CalendarCheck className="h-7 w-7" />}
        eyebrow="Daily plan"
        title="Today has no execution chain yet."
        text="Generate today’s tasks and let the system pick your next proof target."
        action="Open Today"
        onAction={onOpenToday}
      />
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.16),transparent_34%)]" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-[var(--cf-accent)]" />
          <h2 className="text-2xl font-black text-[var(--cf-text)]">
            Next execution
          </h2>
        </div>

        {nextTask ? (
          <>
            <div className="mt-6 rounded-[28px] border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 p-5">
              <div className="flex flex-wrap gap-2">
                {nextTask.is_required ? (
                  <BadgeSoft text="Required" tone="amber" />
                ) : null}

                <BadgeSoft text={format(nextTask.status) || "Available"} tone="purple" />

                {nextTask.skill_tag ? (
                  <BadgeSoft text={nextTask.skill_tag} tone="default" />
                ) : null}
              </div>

              <h3 className="mt-4 text-3xl font-black leading-tight text-[var(--cf-text)]">
                {nextTask.title || "Untitled task"}
              </h3>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
                {nextTask.description || "Open the next task, submit proof, and move."}
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <Info label="Reward" value={`${nextTask.reward_points || 0} pts`} />
                <Info
                  label="Time"
                  value={
                    nextTask.estimated_minutes
                      ? `${nextTask.estimated_minutes} min`
                      : "—"
                  }
                />
                <Info
                  label="Score"
                  value={
                    nextTask.required_score ? `${nextTask.required_score}+` : "—"
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <LiquidGlassButton onClick={() => onOpenTask(nextTask.task_id)}>
                Start task
                <Play className="ml-2 h-4 w-4" />
              </LiquidGlassButton>

              <button
                type="button"
                onClick={onOpenToday}
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
              >
                View daily plan
              </button>
            </div>
          </>
        ) : (
          <div className="mt-6">
            <EmptyInline
              title="No available task."
              text="Everything is either locked, completed, or waiting for review. Open Today to inspect the plan."
              action="Open Today"
              onAction={onOpenToday}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function DailyStatusCard({
  data,
  plan,
  tasks,
  verifiedCount,
  missingPoints,
  estimatedMinutesLeft,
}: {
  data: DashboardData;
  plan: TodayPlan | null;
  tasks: TodayTask[];
  verifiedCount: number;
  missingPoints: number;
  estimatedMinutesLeft: number;
}) {
  return (
    <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 md:p-7">
      <div className="flex items-center gap-3">
        <Activity className="h-5 w-5 text-[var(--cf-accent)]" />
        <h2 className="text-2xl font-black text-[var(--cf-text)]">
          Daily status
        </h2>
      </div>

      <div className="mt-6 space-y-3">
        <StatusRow label="Plan" value={plan ? "Ready" : "Missing"} good={Boolean(plan)} />

        <StatusRow
          label="Verified tasks"
          value={`${verifiedCount}/${tasks.length || 0}`}
          good={tasks.length > 0 && verifiedCount === tasks.length}
        />

        <StatusRow
          label="Required points"
          value={`${data.earned_points_today}/${data.required_points_today}`}
          good={missingPoints === 0}
        />

        <StatusRow
          label="Time left"
          value={estimatedMinutesLeft ? `~${estimatedMinutesLeft} min` : "—"}
          good={estimatedMinutesLeft <= 60}
        />

        <StatusRow
          label="Bonus eligible"
          value={data.bonus_streak_eligible ? "Yes" : "No"}
          good={data.bonus_streak_eligible}
        />
      </div>
    </section>
  );
}

function GoalCard({
  selectedGoal,
  activeGoals,
  onOpenRoadmap,
  onOpenTasks,
}: {
  selectedGoal: Goal | null;
  activeGoals: Goal[];
  onOpenRoadmap: () => void;
  onOpenTasks: () => void;
}) {
  if (!selectedGoal) {
    return (
      <EmptyActionCard
        icon={<Layers3 className="h-7 w-7" />}
        eyebrow="Roadmap"
        title="No active goal selected."
        text="Create a goal so CodeForge can build your execution path."
        action="Open roadmap"
        onAction={onOpenRoadmap}
      />
    );
  }

  return (
    <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-text-muted)]">
        Selected goal
      </p>

      <h2 className="mt-3 text-3xl font-black leading-tight text-[var(--cf-text)]">
        {selectedGoal.title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-[var(--cf-text-secondary)]">
        {format(selectedGoal.status)} • Today tasks:{" "}
        {selectedGoal.today_plan_task_count}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onOpenRoadmap}
          className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
        >
          Open roadmap
        </button>

        <button
          type="button"
          onClick={onOpenTasks}
          className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
        >
          Browse tasks
        </button>
      </div>

      {activeGoals.length > 1 ? (
        <div className="mt-7 grid gap-3">
          {activeGoals.map((goal) => (
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
  );
}

function ExecutionChainCard({
  tasks,
  onOpenTask,
  onOpenToday,
}: {
  tasks: TodayTask[];
  onOpenTask: (taskId: number) => void;
  onOpenToday: () => void;
}) {
  const preview = tasks.slice(0, 5);

  return (
    <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-[var(--cf-accent)]" />
            <h2 className="text-2xl font-black text-[var(--cf-text)]">
              Execution chain
            </h2>
          </div>

          <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">
            Today’s proof path from first task to verified progress.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenToday}
          className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
        >
          Open Today
        </button>
      </div>

      {preview.length ? (
        <div className="mt-6 space-y-3">
          {preview.map((task, index) => (
            <button
              key={`${task.id}-${task.task_id}`}
              type="button"
              onClick={() => onOpenTask(task.task_id)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-left transition hover:border-[var(--cf-primary)]/35 hover:bg-[var(--cf-primary)]/8"
            >
              <div
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-xs font-black",
                  task.status === "verified"
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                    : task.is_required
                    ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                    : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]",
                ].join(" ")}
              >
                {task.status === "verified" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[var(--cf-text)]">
                  {task.title || "Untitled task"}
                </p>

                <p className="mt-1 truncate text-xs text-[var(--cf-text-secondary)]">
                  {format(task.status) || "Available"} • {task.reward_points || 0} pts
                </p>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--cf-text-muted)] transition group-hover:text-[var(--cf-accent)]" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyInline
            title="No chain generated yet."
            text="Open Today to generate your daily execution tasks."
            action="Open Today"
            onAction={onOpenToday}
          />
        </div>
      )}
    </section>
  );
}

function ProgressOrb({ progress }: { progress: number }) {
  return (
    <div
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full p-[3px] shadow-[0_0_40px_rgba(124,92,255,0.22)]"
      style={{
        background: `conic-gradient(rgb(168 85 247) ${progress}%, rgba(255,255,255,0.08) 0)`,
      }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--cf-bg)]">
        <span className="text-xl font-black text-[var(--cf-text)]">
          {progress}%
        </span>
      </div>
    </div>
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

function StatCard({
  icon,
  title,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub: string;
  tone: "default" | "purple" | "gold" | "hot";
}) {
  const toneClass =
    tone === "gold"
      ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
      : tone === "hot"
      ? "border-orange-300/25 bg-orange-400/10 text-orange-200"
      : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]";

  return (
    <div className="group rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-[var(--cf-primary)]/30">
      <div
        className={[
          "flex h-11 w-11 items-center justify-center rounded-2xl border transition group-hover:scale-105",
          toneClass,
        ].join(" ")}
      >
        {icon}
      </div>

      <p className="mt-5 text-sm text-[var(--cf-text-muted)]">{title}</p>
      <p className="mt-2 text-3xl font-black text-[var(--cf-text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">{sub}</p>
    </div>
  );
}

function EmptyActionCard({
  icon,
  eyebrow,
  title,
  text,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-primary)]/25 bg-[linear-gradient(135deg,rgba(124,92,255,0.14),rgba(17,17,26,0.96))] p-7 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.20),transparent_34%)]" />

      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]">
          {icon}
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-accent)]">
          {eyebrow}
        </p>

        <h2 className="mt-3 text-3xl font-black text-[var(--cf-text)]">
          {title}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          {text}
        </p>

        <div className="mt-6">
          <LiquidGlassButton onClick={onAction}>
            {action}
            <ArrowRight className="ml-2 h-4 w-4" />
          </LiquidGlassButton>
        </div>
      </div>
    </section>
  );
}

function EmptyInline({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-6">
      <h3 className="text-2xl font-black text-[var(--cf-text)]">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
        {text}
      </p>

      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-2xl border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 px-5 py-3 text-sm font-black text-[var(--cf-accent)] transition hover:bg-[var(--cf-primary)]/15"
      >
        {action}
      </button>
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

function BadgeSoft({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "purple" | "green" | "amber" | "rose";
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 w-full animate-pulse rounded-[28px] bg-[var(--cf-card)]" />
      <div className="h-80 animate-pulse rounded-[38px] bg-[var(--cf-card)]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-44 animate-pulse rounded-[30px] bg-[var(--cf-card)]" />
        <div className="h-44 animate-pulse rounded-[30px] bg-[var(--cf-card)]" />
        <div className="h-44 animate-pulse rounded-[30px] bg-[var(--cf-card)]" />
        <div className="h-44 animate-pulse rounded-[30px] bg-[var(--cf-card)]" />
      </div>
    </div>
  );
}

function getStateBadge(state: DashboardState) {
  if (state === "no_goal") return "Setup required";
  if (state === "no_plan") return "Plan missing";
  if (state === "secured") return "Secured today";
  return "Pressure active";
}

function getHeroTitle(state: DashboardState) {
  if (state === "no_goal") return "No goal. No execution.";
  if (state === "no_plan") return "Your daily chain is missing.";
  if (state === "secured") return "Daily proof secured.";
  return "You are behind today.";
}

function getHeroText(state: DashboardState, missingPoints: number) {
  if (state === "no_goal") {
    return "Create a goal before CodeForge can generate roadmap pressure, daily tasks, and proof-based execution.";
  }

  if (state === "no_plan") {
    return "Open Today and generate your execution chain. No plan means no verified progress.";
  }

  if (state === "secured") {
    return "You hit the required verified points. You can stop safely or keep pushing for bonus growth.";
  }

  return `You still need ${missingPoints} verified points. Open Today, finish the next task, and submit proof before momentum drops.`;
}

function format(v?: string | null) {
  if (!v) return "";
  return v
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}