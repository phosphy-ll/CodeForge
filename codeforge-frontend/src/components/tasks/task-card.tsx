"use client";

import { TaskCard as TaskCardType } from "@/lib/tasks";
import TaskStatusBadge from "@/components/tasks/task-status-badge";

type TaskCardProps = {
  task: TaskCardType;
  onOpen?: (task: TaskCardType) => void;
  onSkip?: (task: TaskCardType) => void;
};

export default function TaskCard({ task, onOpen, onSkip }: TaskCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:border-violet-500/20 hover:bg-white/[0.045]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{task.title}</h3>
            <TaskStatusBadge status={task.status} />
            <span className="rounded-2xl border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/55">
              {task.is_required ? "Required" : "Optional"}
            </span>
          </div>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
            {task.description || "No description yet."}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <MetaBadge label="Difficulty" value={task.difficulty ? `${task.difficulty}/5` : "—"} />
          <MetaBadge
            label="Time"
            value={task.estimated_minutes ? `${task.estimated_minutes} min` : "—"}
          />
          <MetaBadge label="Reward" value={`${task.reward_points} pts`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoBox label="Attempts" value={`${task.attempts_used} used`} sub={`${task.attempts_left} left`} />
        <InfoBox label="Failed" value={String(task.failed_attempts)} sub="Rejected attempts" />
        <InfoBox
          label="Last result"
          value={task.last_submission_status ? task.last_submission_status.replaceAll("_", " ") : "No submissions"}
          sub={
            task.last_submission_score !== null
              ? `Score: ${task.last_submission_score}`
              : "No score yet"
          }
        />
        <InfoBox
          label="Verification"
          value={capitalize(task.verification_type)}
          sub={capitalize(task.task_type)}
        />
      </div>

      {task.unlock_condition_text ? (
        <div className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/80">
          Locked reason: {task.unlock_condition_text}
        </div>
      ) : null}

      {task.last_submission_feedback ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Latest feedback</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/60">
            {task.last_submission_feedback}
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => onOpen?.(task)}
          disabled={!task.can_submit}
          className={[
            "rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
            task.can_submit
              ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/20 hover:bg-violet-500/25 hover:text-white"
              : "cursor-not-allowed bg-white/5 text-white/30 ring-1 ring-white/5",
          ].join(" ")}
        >
          {task.status === "needs_revision" || task.status === "failed" ? "Retry task" : "Open task"}
        </button>

        {task.can_skip ? (
          <button
            onClick={() => onSkip?.(task)}
            className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-white/65 ring-1 ring-white/10 transition-all duration-300 hover:bg-white/10 hover:text-white"
          >
            Skip
          </button>
        ) : null}

        {task.can_request_manual_review ? (
          <button
            className="rounded-2xl bg-black/20 px-4 py-3 text-sm font-semibold text-white/55 ring-1 ring-white/10 transition-all duration-300 hover:text-white"
          >
            Manual review
          </button>
        ) : null}
      </div>
    </article>
  );
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
      <span className="text-white/35">{label}: </span>
      <span className="font-medium text-white/80">{value}</span>
    </div>
  );
}

function InfoBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs text-white/35">{label}</p>
      <p className="mt-2 text-sm font-medium capitalize text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{sub}</p>
    </div>
  );
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}