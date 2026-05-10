"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSelectedGoalId, saveSelectedGoalId } from "@/lib/selected-goal";

type DashboardGoal = {
  goal_id: number;
  title: string;
  status: string;
  today_plan_task_count: number;
};

type DashboardData = {
  selected_goal: DashboardGoal | null;
  active_goals: DashboardGoal[];
};

type Milestone = {
  id: number;
  goal_id: number;
  title: string;
  order: number;
  status: string;
  created_at: string;
};

type Task = {
  id: number;
  milestone_id: number;
  title: string;
  description: string | null;
  task_type: string;
  verification_type: string;
  max_attempts: number;
  required_score: number;
  reward_points: number;
  status: string;
  is_required: boolean;
  unlock_condition_text: string | null;
  difficulty: number | null;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export default function TasksPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  const selectedGoal = dashboard?.selected_goal ?? null;

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);

        const dashboardResponse = await api.get("/me/dashboard");
        const dashboardData = dashboardResponse.data as DashboardData;

        const savedGoalId = getSelectedGoalId();

        const goalExists = dashboardData.active_goals?.some(
          (goal) => goal.goal_id === savedGoalId
        );

        const goalId = goalExists
          ? savedGoalId
          : dashboardData.selected_goal?.goal_id;

        const selectedGoalFromStorage =
          dashboardData.active_goals?.find((goal) => goal.goal_id === goalId) ??
          dashboardData.selected_goal;

        const fixedDashboardData = {
          ...dashboardData,
          selected_goal: selectedGoalFromStorage,
        };

        setDashboard(fixedDashboardData);

        if (goalId) {
          saveSelectedGoalId(goalId);
        }
        const milestonesResponse = await api.get(`/milestones/goal/${goalId}`);
        const milestonesData = Array.isArray(milestonesResponse.data)
          ? milestonesResponse.data
          : [];

        const sortedMilestones = [...milestonesData].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );

        setMilestones(sortedMilestones);

        const firstAvailable =
          sortedMilestones.find((m) => m.status !== "locked") ?? sortedMilestones[0];

        setSelectedMilestoneId(firstAvailable?.id ?? null);
      } catch {
        setDashboard(null);
        setMilestones([]);
        setSelectedMilestoneId(null);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      if (!selectedMilestoneId) {
        setTasks([]);
        return;
      }

      try {
        setTasksLoading(true);

        const response = await api.get(`/tasks/milestone/${selectedMilestoneId}`);
        const data = Array.isArray(response.data) ? response.data : [];

        setTasks(data);
      } catch {
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    }

    loadTasks();
  }, [selectedMilestoneId]);

  const selectedMilestone = milestones.find((m) => m.id === selectedMilestoneId) ?? null;

  const stats = useMemo(() => {
    const total = tasks.length;
    const verified = tasks.filter((t) => t.status === "verified").length;
    const submittable = tasks.filter((t) =>
      ["available", "in_progress", "needs_revision", "failed"].includes(t.status)
    ).length;
    const locked = tasks.filter((t) => t.status === "locked").length;

    return { total, verified, submittable, locked };
  }, [tasks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-36 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (!selectedGoal) {
    return (
      <div className="space-y-8">
        <Header />

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-semibold text-white">No goal yet</h2>

          <p className="mt-3 text-sm leading-7 text-white/50">
            Create your first goal to unlock tasks, roadmap progression, and verified execution.
          </p>

          <button
            onClick={() => router.push("/roadmap")}
            className="mt-6 rounded-2xl bg-violet-500/20 px-6 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 hover:text-white"
          >
            Create goal
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header />

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/35">
              Current goal
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {selectedGoal.title}
            </h2>

            <p className="mt-3 text-sm text-white/50">
              {format(selectedGoal.status)} • Today tasks: {selectedGoal.today_plan_task_count}
            </p>
          </div>

          <button
            onClick={() => router.push("/roadmap")}
            className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-violet-500/20 hover:text-white"
          >
            Open roadmap
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Milestones</h2>

            <p className="mt-2 text-sm text-white/50">
              Select a milestone to focus your execution flow.
            </p>
          </div>

          {milestones.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/50">
                No milestones found for this goal. Open roadmap to create and organize them first.
              </p>

              <button
                onClick={() => router.push("/roadmap")}
                className="mt-4 rounded-2xl bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 hover:text-white"
              >
                Open roadmap
              </button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {milestones.map((milestone) => {
                const active = milestone.id === selectedMilestoneId;
                const locked = milestone.status === "locked";

                return (
                  <button
                    key={milestone.id}
                    onClick={() => setSelectedMilestoneId(milestone.id)}
                    className={[
                      "min-w-[220px] rounded-2xl border px-4 py-4 text-left transition-all duration-200",
                      active
                        ? "border-violet-500/30 bg-violet-500/10 text-white"
                        : "border-white/10 bg-black/20 text-white/60 hover:bg-white/5 hover:text-white",
                      locked ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <p className="text-sm text-white/35">
                      Milestone {milestone.order ?? milestone.id}
                    </p>

                    <p className="mt-2 font-semibold">{milestone.title}</p>

                    <p className="mt-2 text-xs text-white/40">
                      {format(milestone.status)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/35">
              Execution context
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {selectedMilestone ? selectedMilestone.title : "Select a milestone"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/50">
              Focus on task execution, verified progress, and revision loops.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Tasks" value={stats.total} />
            <MiniStat label="Submittable" value={stats.submittable} />
            <MiniStat label="Verified" value={stats.verified} />
            <MiniStat label="Locked" value={stats.locked} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {tasksLoading ? (
          <>
            <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
          </>
        ) : tasks.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="text-2xl font-semibold text-white">No tasks yet</h2>

            <p className="mt-3 text-sm leading-7 text-white/50">
              This milestone does not have execution cards yet. Generate tasks or open another milestone.
            </p>

            <button
              onClick={() => router.push("/roadmap")}
              className="mt-6 rounded-2xl bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 hover:text-white"
            >
              Open roadmap
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={() => router.push(`/tasks/${task.id}`)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1 className="text-3xl font-bold text-white">Tasks</h1>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
        Execute your current milestone tasks, track attempts, and push verified progress.
      </p>
    </header>
  );
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const locked = task.status === "locked";

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />

            <Badge>{format(task.task_type)}</Badge>
            <Badge>{format(task.verification_type)}</Badge>

            {task.is_required ? (
              <Badge>Required</Badge>
            ) : (
              <Badge>Optional</Badge>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-semibold text-white">
            {task.title}
          </h2>

          {task.description && (
            <p
              className="mt-3 max-w-4xl text-sm leading-7 text-white/50"
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {task.description}
            </p>
          )}

          {locked && task.unlock_condition_text && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/45">
              Locked: {task.unlock_condition_text}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <MiniInfo label="Difficulty" value={task.difficulty ? `${task.difficulty}/5` : "—"} />
            <MiniInfo label="Time" value={task.estimated_minutes ? `${task.estimated_minutes} min` : "—"} />
            <MiniInfo label="Reward" value={`${task.reward_points} pts`} />
            <MiniInfo label="Required score" value={`${task.required_score}%`} />
            <MiniInfo label="Max attempts" value={String(task.max_attempts)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 xl:justify-end">
          <button
            onClick={onOpen}
            disabled={locked}
            className={[
              "rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200",
              locked
                ? "cursor-not-allowed border border-white/10 bg-black/20 text-white/25"
                : "bg-violet-500/20 text-violet-100 hover:bg-violet-500/30 hover:text-white hover:scale-[1.02]",
            ].join(" ")}
          >
            {locked ? "Locked" : getTaskActionLabel(task.status)}
          </button>
        </div>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs text-white/35">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs text-white/35">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/80">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/50">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "verified"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : status === "needs_revision"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
      : status === "failed"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
      : status === "locked"
      ? "border-white/10 bg-black/20 text-white/35"
      : "border-violet-500/20 bg-violet-500/10 text-violet-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>
      {format(status)}
    </span>
  );
}

function getTaskActionLabel(status: string) {
  if (status === "verified") return "View result";
  if (status === "submitted") return "View submission";
  if (status === "needs_revision") return "Revise";
  if (status === "failed") return "Retry";
  return "Open task";
}

function format(value?: string | null) {
  if (!value) return "—";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}