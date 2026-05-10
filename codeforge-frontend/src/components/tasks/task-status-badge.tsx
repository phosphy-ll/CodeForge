type TaskStatusBadgeProps = {
  status: string;
};

const statusMap: Record<string, string> = {
  available: "bg-white/5 text-white/70 border-white/10",
  in_progress: "bg-violet-500/10 text-violet-200 border-violet-500/20",
  submitted: "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-500/20",
  verified: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-200 border-rose-500/20",
  needs_revision: "bg-amber-500/10 text-amber-200 border-amber-500/20",
  skipped: "bg-white/5 text-white/45 border-white/10",
  locked: "bg-white/5 text-white/35 border-white/10",
};

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const classes = statusMap[status] ?? "bg-white/5 text-white/60 border-white/10";

  return (
    <span
      className={[
        "inline-flex items-center rounded-2xl border px-3 py-1 text-xs font-medium capitalize",
        classes,
      ].join(" ")}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}