"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  Map,
  Plus,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { getSelectedGoalId, saveSelectedGoalId } from "@/lib/selected-goal";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";
import React from "react";

type GoalItem = {
  id: number;
  title: string;
  description?: string | null;
  language?: string | null;
  goal_type?: string | null;
  status?: string | null;
};

type RoadmapGoal = {
  id: number;
  title: string;
  description: string | null;
  language: string;
  goal_type: string;
  status: string;
};

type RoadmapTask = {
  id: number;
  title: string;
  description: string | null;
  task_type: string;
  verification_type: string;
  status: string;
  reward_points: number;
  difficulty: number | null;
  estimated_minutes: number | null;
  is_required: boolean;
  unlock_condition_text: string | null;
};

type RoadmapMilestone = {
  id: number;
  title: string;
  order: number;
  status: string;
  tasks: RoadmapTask[];
};

type RoadmapResponse = {
  goal: RoadmapGoal;
  milestones: RoadmapMilestone[];
};

export default function RoadmapPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState("");

  async function loadGoals() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/goals");
      const loadedGoals = Array.isArray(response.data) ? response.data : [];

      setGoals(loadedGoals);

      if (loadedGoals.length > 0) {
        const savedGoalId = getSelectedGoalId();
        const savedExists = loadedGoals.some((goal: GoalItem) => goal.id === savedGoalId);

        const nextGoalId = savedExists ? savedGoalId : loadedGoals[0].id;

        setSelectedGoalId(nextGoalId);
        saveSelectedGoalId(nextGoalId);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load goals.");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoadmap(goalId: number) {
    try {
      setRoadmapLoading(true);
      setError("");

      const response = await api.get(`/roadmap/goal/${goalId}`);
      setRoadmap(response.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load roadmap.");
      setRoadmap(null);
    } finally {
      setRoadmapLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    if (selectedGoalId) loadRoadmap(selectedGoalId);
  }, [selectedGoalId]);

  const stats = useMemo(() => {
    const milestones = roadmap?.milestones || [];
    const tasks = milestones.flatMap((milestone) => milestone.tasks || []);

    const verifiedTasks = tasks.filter((task) => task.status === "verified");
    const availableTasks = tasks.filter((task) =>
      ["available", "in_progress", "needs_revision", "failed", "submitted"].includes(task.status)
    );

    const totalPoints = tasks.reduce((sum, task) => sum + (task.reward_points || 0), 0);
    const verifiedPoints = verifiedTasks.reduce(
      (sum, task) => sum + (task.reward_points || 0),
      0
    );

    const nextTask =
      availableTasks.find((task) => task.is_required) || availableTasks[0] || null;

    const progress = tasks.length
      ? Math.round((verifiedTasks.length / tasks.length) * 100)
      : 0;

    return {
      milestones,
      tasks,
      verifiedTasks,
      availableTasks,
      nextTask,
      totalPoints,
      verifiedPoints,
      progress,
    };
  }, [roadmap]);

  if (loading) {
    return <RoadmapSkeleton />;
  }

  if (goals.length === 0) {
    return (
      <main data-tour="roadmap-main" className="space-y-8">
        <Header />

        <section className="rounded-[36px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
          <Map className="h-9 w-9 text-[var(--cf-accent)]" />

          <h2 className="mt-5 text-3xl font-black text-[var(--cf-text)]">
            No roadmap yet.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            Create a goal first. CodeForge will use it to generate milestones,
            daily plans, and proof-based execution.
          </p>

          <div className="mt-7">
            <LiquidGlassButton onClick={() => router.push("/goals/new")}>
              Create goal <Plus className="ml-2 h-4 w-4" />
            </LiquidGlassButton>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <Header />

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[36px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
              Active execution path
            </p>

            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-[var(--cf-text)]">
              {roadmap?.goal?.title || "Roadmap"}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {isRealText(roadmap?.goal?.description)
                ? roadmap?.goal.description
                : "This is your current progression map. Daily plans pull from this structure and adapt around your execution."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <LiquidGlassButton onClick={() => router.push("/today")}>
                Open Today <ArrowRight className="ml-2 h-4 w-4" />
              </LiquidGlassButton>

              <button
                onClick={() => router.push("/goals/new")}
                className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
              >
                Create new goal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Metric label="Progress" value={`${stats.progress}%`} />
            <Metric label="Tasks" value={`${stats.verifiedTasks.length}/${stats.tasks.length}`} />
            <Metric label="Points" value={`${stats.verifiedPoints}/${stats.totalPoints}`} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <aside className="space-y-5">
          <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-[var(--cf-accent)]" />
              <h2 className="text-xl font-black text-[var(--cf-text)]">
                Goals
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {goals.map((goal) => {
                const active = goal.id === selectedGoalId;

                return (
                  <button
                    key={goal.id}
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      saveSelectedGoalId(goal.id);
                    }}
                    className={[
                      "group relative w-full overflow-hidden rounded-3xl border p-5 text-left backdrop-blur-xl transition-all duration-300",
                      active
                        ? "border-[var(--cf-primary)]/40 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(124,92,255,0.08))] text-[var(--cf-text)] shadow-[0_0_36px_var(--cf-glow)]"
                        : "border-[var(--cf-border)] bg-white/[0.025] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/25 hover:bg-white/[0.045] hover:text-[var(--cf-text)]",
                    ].join(" ")}
                  >
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                      <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
                    </div>

                    <div className="relative">
                      <p className="text-lg font-black tracking-tight">{goal.title}</p>
                      <p className="mt-2 text-xs text-[var(--cf-text-muted)]">
                        {format(goal.language)} • {format(goal.status)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-[var(--cf-accent)]" />
              <h2 className="text-xl font-black text-[var(--cf-text)]">
                Roadmap stats
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <StatusRow label="Milestones" value={String(stats.milestones.length)} />
              <StatusRow label="Tasks" value={String(stats.tasks.length)} />
              <StatusRow label="Verified" value={String(stats.verifiedTasks.length)} />
              <StatusRow label="Available" value={String(stats.availableTasks.length)} />
            </div>
          </section>

          {stats.nextTask ? (
            <section className="rounded-[30px] border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 p-6 shadow-[0_0_34px_var(--cf-glow)]">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-[var(--cf-accent)]" />
                <h2 className="text-xl font-black text-[var(--cf-text)]">
                  Next unlocked task
                </h2>
              </div>

              <h3 className="mt-5 text-lg font-black text-[var(--cf-text)]">
                {stats.nextTask.title}
              </h3>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--cf-text-secondary)]">
                {stats.nextTask.description || "Open and execute with proof."}
              </p>

              <div className="mt-5">
                <LiquidGlassButton onClick={() => router.push(`/tasks/${stats.nextTask?.id}`)}>
                  Open task
                </LiquidGlassButton>
              </div>
            </section>
          ) : null}
        </aside>

        <section className="space-y-5">
          {roadmapLoading ? (
            <RoadmapLoading />
          ) : stats.milestones.length > 0 ? (
            stats.milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                index={index}
                onOpenTask={(taskId) => router.push(`/tasks/${taskId}`)}
              />
            ))
          ) : (
            <section className="rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
              <h2 className="text-2xl font-black text-[var(--cf-text)]">
                No milestones yet.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
                This goal exists, but no milestone structure is visible yet.
                Later we can add AI milestone generation here.
              </p>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header>
      <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
        Roadmap
      </p>
      <h1 className="mt-2 text-4xl font-black text-[var(--cf-text)]">
        Progression map
      </h1>
    </header>
  );
}

function MilestoneCard({
  milestone,
  index,
  onOpenTask,
}: {
  milestone: RoadmapMilestone;
  index: number;
  onOpenTask: (taskId: number) => void;
}) {
  const taskCount = milestone.tasks.length;
  const verifiedCount = milestone.tasks.filter((task) => task.status === "verified").length;
  const progress = taskCount ? Math.round((verifiedCount / taskCount) * 100) : 0;

  return (
    <article className="relative overflow-hidden rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
      

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-3 py-1 text-xs font-black text-[var(--cf-accent)]">
              Milestone {index + 1}
            </span>
            <StatusBadge status={milestone.status} />
          </div>

          <h2 className="mt-4 text-2xl font-black text-[var(--cf-text)]">
            {milestone.title}
          </h2>

          <div className="mt-5 h-4 max-w-xl overflow-hidden rounded-full border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-[3px] shadow-[inset_0_0_18px_rgba(255,255,255,0.04)]">
            <div
              className="relative h-full overflow-hidden rounded-full bg-[linear-gradient(90deg,#7C5CFF,#A78BFA,#C4B5FD)] transition-all duration-700"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.06)_45%,rgba(255,255,255,0.16))]" />
              <div className="absolute -left-1/2 top-[-50%] h-[200%] w-[45%] rotate-12 animate-[glassFlow_2.8s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)] blur-md" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Metric label="Tasks" value={`${verifiedCount}/${taskCount}`} />
          <Metric label="Progress" value={`${progress}%`} />
        </div>
      </div>

      <div className="relative mt-6 space-y-3">
        {milestone.tasks.map((task) => (
          <TaskRow key={task.id} task={task} onOpen={() => onOpenTask(task.id)} />
        ))}
      </div>
    </article>
  );
}

function TaskRow({ task, onOpen }: { task: RoadmapTask; onOpen: () => void }) {
  const locked = task.status === "locked";
  const verified = task.status === "verified";

  return (
    <article
      className={[
        "group w-full rounded-2xl border p-4 text-left transition-all duration-300",
        verified
          ? "border-emerald-500/20 bg-emerald-500/8"
          : locked
          ? "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] opacity-55"
          : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] hover:border-[var(--cf-primary)]/35 hover:bg-[var(--cf-primary)]/8",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIcon status={task.status} />
            <StatusBadge status={task.status} />
            <SmallBadge>{format(task.task_type)}</SmallBadge>
            <SmallBadge>{format(task.verification_type)}</SmallBadge>
            {task.is_required ? <SmallBadge>Required</SmallBadge> : null}
          </div>

          <h3 className="mt-3 text-lg font-black text-[var(--cf-text)]">
            {task.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--cf-text-secondary)]">
            {task.description || "No description."}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <SmallBadge>{task.reward_points} pts</SmallBadge>
          <SmallBadge>{task.estimated_minutes || "—"} min</SmallBadge>
          <SmallBadge>{task.difficulty ? `${task.difficulty}/5` : "—"}</SmallBadge>

          {!locked ? (
            <span className="ml-0 lg:ml-3">
              <LiquidGlassButton onClick={onOpen} className="px-4 py-2">
                Open
              </LiquidGlassButton>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "verified") return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status === "locked") return <Lock className="h-4 w-4 text-[var(--cf-text-muted)]" />;
  if (status === "submitted") return <Clock className="h-4 w-4 text-cyan-300" />;
  return <Target className="h-4 w-4 text-[var(--cf-accent)]" />;
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "verified"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : status === "needs_revision" || status === "failed"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
      : status === "submitted"
      ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
      : status === "locked"
      ? "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-muted)]"
      : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {format(status)}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[105px] rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3">
      <p className="text-xs text-[var(--cf-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
      <p className="text-sm text-[var(--cf-text-secondary)]">{label}</p>
      <p className="text-sm font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function SmallBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--cf-border)] bg-[var(--cf-card)] px-3 py-1 text-xs font-bold text-[var(--cf-text-secondary)]">
      {children}
    </span>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {text}
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-72 animate-pulse rounded-2xl bg-[var(--cf-card)]" />
      <div className="h-72 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
      <div className="h-96 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
    </div>
  );
}

function RoadmapLoading() {
  return (
    <div className="space-y-5">
      <div className="h-64 animate-pulse rounded-[34px] bg-[var(--cf-card)]" />
      <div className="h-64 animate-pulse rounded-[34px] bg-[var(--cf-card)]" />
    </div>
  );
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isRealText(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return !["string", "null", "undefined", ""].includes(normalized);
}