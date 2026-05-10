"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  ShieldAlert,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type FeedItem = {
  id: number;
  source: "task" | "practice" | "quiz" | "exam" | string;
  title: string;
  skill_name: string | null;
  status: string;
  score: number | null;
  earned_points: number;
  max_points: number | null;
  suspicion_score: number | null;
  feedback: string | null;
  manual_review_requested: boolean;
  created_at: string;
};

type FeedResponse = {
  total_items: number;
  avg_score: number | null;
  total_earned_points: number;
  rejected_count: number;
  partial_count: number;
  verified_count: number;
  items: FeedItem[];
};

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Tasks", value: "task" },
  { label: "Practice", value: "practice" },
  { label: "Quiz", value: "quiz" },
  { label: "Exams", value: "exam" },
  { label: "Rejected", value: "rejected" },
];

export default function SubmissionsPage() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFeed() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<FeedResponse>("/submissions/feed");
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load execution feed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, []);

  const items = useMemo(() => {
    if (!data) return [];

    if (filter === "all") return data.items;

    if (filter === "rejected") {
      return data.items.filter((item) => item.status === "rejected");
    }

    return data.items.filter((item) => item.source === filter);
  }, [data, filter]);

  const executionQuality = getExecutionQuality(data?.avg_score ?? null);

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Submissions
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
          Execution history
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Every proof attempt, quiz, drill, and exam lives here. This is your
          real execution trail — not fake checkbox progress.
        </p>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.2),transparent_35%)]" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-[var(--cf-accent)]">
                <Brain className="h-5 w-5" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">
                  Execution overview
                </p>
              </div>

              <h2 className="mt-4 text-4xl font-black text-[var(--cf-text)]">
                {executionQuality.title}
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
                {executionQuality.text}
              </p>
            </div>

            <LiquidGlassButton onClick={loadFeed} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh feed"}
              <Sparkles className="ml-2 h-4 w-4" />
            </LiquidGlassButton>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Average score"
              value={data?.avg_score != null ? `${data.avg_score}%` : "—"}
              icon={<Target className="h-5 w-5" />}
            />
            <MetricCard
              label="Verified"
              value={`${data?.verified_count ?? 0}`}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <MetricCard
              label="Rejected"
              value={`${data?.rejected_count ?? 0}`}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <MetricCard
              label="Earned"
              value={`${data?.total_earned_points ?? 0}`}
              icon={<Flame className="h-5 w-5" />}
            />
            <MetricCard
              label="Attempts"
              value={`${data?.total_items ?? 0}`}
              icon={<Zap className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-2 flex items-center gap-2 text-[var(--cf-text-muted)]">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-[0.18em]">
              Filter
            </span>
          </div>

          {FILTERS.map((item) => {
            const active = filter === item.value;

            return (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={[
                  "rounded-2xl border px-4 py-2 text-sm font-bold transition-all duration-300",
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

      <section className="space-y-5">
        {loading ? (
          <EmptyState title="Loading execution feed..." text="Pulling proof history." />
        ) : null}

        {!loading && items.length === 0 ? (
          <EmptyState
            title="No attempts found."
            text="Submit tasks, practice drills, quizzes, or exams to build your execution history."
          />
        ) : null}

        {items.map((item) => {
          const key = `${item.source}-${item.id}`;
          const expanded = expandedId === key;

          return (
            <FeedCard
              key={key}
              item={item}
              expanded={expanded}
              onToggle={() => setExpandedId(expanded ? null : key)}
            />
          );
        })}
      </section>
    </main>
  );
}

function FeedCard({
  item,
  expanded,
  onToggle,
}: {
  item: FeedItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tone = getTone(item);
  const pressure = getPressureMessage(item);

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[34px] border p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] transition-all duration-300",
        tone.card,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.14),transparent_36%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge text={item.source.toUpperCase()} className={tone.badge} />
              <Badge text={format(item.status)} className={tone.statusBadge} />

              {item.manual_review_requested ? (
                <Badge
                  text="Manual review"
                  className="border-amber-400/25 bg-amber-400/10 text-amber-200"
                />
              ) : null}
            </div>

            <h2 className="mt-4 text-2xl font-black text-[var(--cf-text)]">
              {item.title}
            </h2>

            <p className="mt-2 text-sm leading-7 text-[var(--cf-text-secondary)]">
              {pressure}
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-3 gap-3">
            <MiniStat label="Score" value={item.score != null ? `${item.score}%` : "—"} />
            <MiniStat label="Points" value={`+${item.earned_points}`} />
            <MiniStat label="Risk" value={`${item.suspicion_score ?? 0}`} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <DetailPill
            label="Skill"
            value={item.skill_name || "unknown"}
          />
          <DetailPill
            label="Max points"
            value={item.max_points != null ? `${item.max_points}` : "—"}
          />
          <DetailPill
            label="Created"
            value={formatDate(item.created_at)}
          />
        </div>

        {item.feedback ? (
          <div className="mt-5 rounded-3xl border border-[var(--cf-border)] bg-black/15 p-5">
            <p
              className={[
                "text-sm leading-7 text-[var(--cf-text-secondary)]",
                expanded ? "whitespace-pre-wrap" : "line-clamp-2",
              ].join(" ")}
            >
              {item.feedback}
            </p>

            <button
              onClick={onToggle}
              className="mt-4 text-sm font-black text-[var(--cf-accent)] transition hover:text-[var(--cf-text)]"
            >
              {expanded ? "Hide feedback" : "View full feedback"}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
      <div className="flex items-center gap-3 text-[var(--cf-accent)]">
        {icon}
        <p className="text-xs font-black uppercase tracking-[0.16em]">
          {label}
        </p>
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

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--cf-text-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-[var(--cf-text-secondary)]">
        {value}
      </p>
    </div>
  );
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]",
        className,
      ].join(" ")}
    >
      {text}
    </span>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
      <Clock className="h-7 w-7 text-[var(--cf-accent)]" />
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

function getExecutionQuality(score: number | null) {
  if (score == null) {
    return {
      title: "No execution signal yet.",
      text: "Submit proof to build your execution profile.",
    };
  }

  if (score >= 85) {
    return {
      title: "Execution quality: strong.",
      text: "Your recent proof quality is high. Keep stacking verified attempts and avoid comfort-mode submissions.",
    };
  }

  if (score >= 65) {
    return {
      title: "Execution quality: unstable.",
      text: "You are moving, but proof quality is inconsistent. Focus on clearer explanations and stronger edge cases.",
    };
  }

  return {
    title: "Execution quality: weak.",
    text: "Your history shows too many low-quality attempts. Slow down, submit real code, and explain decisions clearly.",
  };
}

function getTone(item: FeedItem) {
  if (item.status === "rejected") {
    return {
      card: "border-rose-500/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(17,17,26,0.96))]",
      badge: "border-rose-400/25 bg-rose-400/10 text-rose-200",
      statusBadge: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    };
  }

  if (item.source === "exam") {
    return {
      card: "border-violet-400/25 bg-[linear-gradient(135deg,rgba(124,92,255,0.15),rgba(17,17,26,0.96))]",
      badge: "border-violet-400/25 bg-violet-400/10 text-violet-200",
      statusBadge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    };
  }

  if (item.source === "quiz") {
    return {
      card: "border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(17,17,26,0.96))]",
      badge: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
      statusBadge: "border-violet-400/25 bg-violet-400/10 text-violet-200",
    };
  }

  if (item.source === "practice") {
    return {
      card: "border-orange-400/20 bg-[linear-gradient(135deg,rgba(251,146,60,0.09),rgba(17,17,26,0.96))]",
      badge: "border-orange-400/25 bg-orange-400/10 text-orange-200",
      statusBadge: "border-violet-400/25 bg-violet-400/10 text-violet-200",
    };
  }

  return {
    card: "border-[var(--cf-border)] bg-[var(--cf-card)]",
    badge: "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]",
    statusBadge: "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)]",
  };
}

function getPressureMessage(item: FeedItem) {
  if (item.status === "rejected") {
    return "Proof failed. CodeForge saw no reliable evidence of real progress.";
  }

  if (item.suspicion_score && item.suspicion_score >= 70) {
    return "Suspicious proof pattern detected. Stronger explanation is required.";
  }

  if (item.status === "verified" && (item.score ?? 0) >= 85) {
    return "Strong proof. This attempt meaningfully supports your execution profile.";
  }

  if (item.status === "partial") {
    return "Partial proof. You earned points, but the attempt still exposed weak execution.";
  }

  if (item.status === "pending_review") {
    return "Waiting for review. No confirmed execution signal yet.";
  }

  return "Execution attempt recorded. Keep stacking stronger proof.";
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}