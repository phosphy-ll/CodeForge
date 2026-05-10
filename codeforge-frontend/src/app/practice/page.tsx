"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  Brain,
  Flame,
  Gauge,
  GraduationCap,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { getSelectedGoalId } from "@/lib/selected-goal";
import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type PracticeSkillFocus = {
  skill_name: string;
  weakness_score: number;
  weakness_percent: number;
  tier: string;
};

type PracticeDrill = {
  id: string;
  skill_name: string;
  tier: string;
  title: string;
  description: string;
  difficulty: number;
  estimated_minutes: number;
  reward_points: number;
  reason: string;
  action_type: string;
};

type PracticeDrillsResponse = {
  focus_skill: PracticeSkillFocus | null;
  recovery_drills: PracticeDrill[];
  stabilization_drills: PracticeDrill[];
  mastery_drills: PracticeDrill[];
};

type LearnTopicResponse = {
  title: string;
  explanation: string;
  key_points: string[];
  common_mistakes: string[];
  mini_example: string;
  practice_prompt: string;
  proof_requirements: string[];
};

export default function PracticePage() {
  const [data, setData] = useState<PracticeDrillsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [learning, setLearning] = useState(false);
  const [learnError, setLearnError] = useState("");
  const [learnData, setLearnData] = useState<LearnTopicResponse | null>(null);

  async function loadDrills(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await api.get("/practice/drills");
      setData(response.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load practice drills.");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function learnFirst(skillName: string) {
    try {
      setLearning(true);
      setLearnError("");
      setLearnData(null);

      const goalId = getSelectedGoalId();

      if (!goalId) {
        throw new Error("Select a goal first.");
      }

      const response = await api.post("/ai/learn-topic", {
        goal_id: goalId,
        topic: skillName,
        language: null,
        level: null,
      });

      setLearnData(response.data || null);
    } catch (err: any) {
      setLearnError(
        err?.message ||
          err?.response?.data?.detail ||
          "Failed to open Learn Mode."
      );
    } finally {
      setLearning(false);
    }
  }

  useEffect(() => {
    loadDrills();
  }, []);

  const stats = useMemo(() => {
    const recovery = data?.recovery_drills || [];
    const stabilization = data?.stabilization_drills || [];
    const mastery = data?.mastery_drills || [];
    const all = [...recovery, ...stabilization, ...mastery];

    return {
      recovery,
      stabilization,
      mastery,
      all,
      total: all.length,
      totalReward: all.reduce((sum, drill) => sum + drill.reward_points, 0),
      totalMinutes: all.reduce((sum, drill) => sum + drill.estimated_minutes, 0),
      topDrill: recovery[0] || stabilization[0] || mastery[0] || null,
    };
  }, [data]);

  if (loading) {
    return <PracticeSkeleton />;
  }

  return (
    <main className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            Practice
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
            Adaptive pressure training
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            Practice is where CodeForge attacks unstable skills. Drills are
            generated from weakness data, failed proof, and execution risk.
          </p>
        </div>

        <LiquidGlassButton
          onClick={() => loadDrills(true)}
          disabled={refreshing}
          className="min-w-[220px] justify-center"
        >
          {refreshing ? "Refreshing..." : "Refresh drills"}
        </LiquidGlassButton>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--cf-accent)]">
              <Zap className="h-4 w-4" />
              Training arena
            </div>

            <h2 className="mt-6 max-w-4xl text-3xl font-black leading-tight tracking-tight text-[var(--cf-text)] xl:text-4xl">
              {data?.focus_skill
                ? `Recover ${formatSkill(data.focus_skill.skill_name)} through targeted drills.`
                : "No practice target yet."}
            </h2>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {data?.focus_skill
                ? `Current weakness: ${data.focus_skill.weakness_percent}%. Start with recovery if risk is high, or stabilize the skill with shorter drills.`
                : "Submit more tasks first. Practice needs weakness data to generate useful drills."}
            </p>

            {stats.topDrill ? (
              <div className="mt-7 flex flex-wrap gap-3">
                <LiquidGlassButton onClick={() => learnFirst(stats.topDrill!.skill_name)}>
                  Learn first
                  <Brain className="ml-2 h-4 w-4" />
                </LiquidGlassButton>

                <LiquidGlassButton
                  onClick={() => {
                    if (!stats.topDrill) return;

                    window.location.href = `/practice/session?skill=${encodeURIComponent(
                      stats.topDrill.skill_name
                    )}&type=${encodeURIComponent(stats.topDrill.action_type)}`;
                  }}
                >
                  Start drill
                  <Play className="ml-2 h-4 w-4" />
                </LiquidGlassButton>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Drills" value={String(stats.total)} />
            <Metric label="Recovery" value={String(stats.recovery.length)} />
            <Metric label="Potential pts" value={String(stats.totalReward)} />
            <Metric label="Minutes" value={`${stats.totalMinutes}m`} />
          </div>
        </div>
      </section>

      {learnError ? <ErrorBox text={learnError} /> : null}

      {learning ? (
        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
          <p className="text-sm text-[var(--cf-text-secondary)]">
            Learn Mode is generating...
          </p>
        </section>
      ) : null}

      {learnData ? (
        <LearnPanel data={learnData} onClose={() => setLearnData(null)} />
      ) : null}

      {stats.total === 0 ? (
        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
          <ShieldCheck className="h-8 w-8 text-[var(--cf-accent)]" />

          <h2 className="mt-5 text-3xl font-black text-[var(--cf-text)]">
            No drills yet.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            Complete tasks and submit proof first. Practice becomes useful when
            CodeForge sees your weak areas.
          </p>
        </section>
      ) : (
        <section className="space-y-6">
          <DrillSection
            title="Recovery drills"
            subtitle="High-risk skills. Fix these before stacking more work."
            icon={<Flame className="h-5 w-5" />}
            drills={stats.recovery}
            empty="No high-risk drills right now."
            onLearn={learnFirst}
          />

          <DrillSection
            title="Stabilization drills"
            subtitle="Medium-risk skills. Repetition turns unstable proof into reliable execution."
            icon={<Gauge className="h-5 w-5" />}
            drills={stats.stabilization}
            empty="No stabilization drills right now."
            onLearn={learnFirst}
          />

          <DrillSection
            title="Mastery maintenance"
            subtitle="Stable skills. Keep them warm without wasting too much pressure."
            icon={<Award className="h-5 w-5" />}
            drills={stats.mastery}
            empty="No mastery drills right now."
            onLearn={learnFirst}
          />
        </section>
      )}
    </main>
  );
}

function DrillSection({
  title,
  subtitle,
  icon,
  drills,
  empty,
  onLearn,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  drills: PracticeDrill[];
  empty: string;
  onLearn: (skillName: string) => void;
}) {
  return (
    <section className="rounded-[36px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]">
          {icon}
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-[var(--cf-text)]">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-[var(--cf-text-secondary)]">
            {subtitle}
          </p>
        </div>
      </div>

      {drills.length > 0 ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {drills.map((drill) => (
            <DrillCard key={drill.id} drill={drill} onLearn={onLearn} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-sm text-[var(--cf-text-secondary)]">
          {empty}
        </p>
      )}
    </section>
  );
}

function DrillCard({
  drill,
  onLearn,
}: {
  drill: PracticeDrill;
  onLearn: (skillName: string) => void;
}) {
  const config = getTierConfig(drill.tier);

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[30px] border p-5 transition-all duration-300",
        config.cardClass,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={config.badgeClass}>{format(drill.tier)}</Badge>
          <Badge>{format(drill.action_type)}</Badge>
          <Badge>Difficulty {drill.difficulty}/5</Badge>
        </div>

        <h3 className="mt-4 text-xl font-black tracking-tight text-[var(--cf-text)]">
          {drill.title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
          {drill.description}
        </p>

        <div className="mt-4 rounded-2xl border border-[var(--cf-border)] bg-black/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--cf-text-muted)]">
            Generated because
          </p>

          <p className="mt-2 text-sm leading-6 text-[var(--cf-text-secondary)]">
            {drill.reason}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{drill.reward_points} pts</Badge>
            <Badge>{drill.estimated_minutes} min</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onLearn(drill.skill_name)}
              className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-2 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
            >
              Learn first
            </button>

            <LiquidGlassButton
              onClick={() => {
                window.location.href = `/practice/session?skill=${encodeURIComponent(
                  drill.skill_name
                )}&type=${encodeURIComponent(drill.action_type)}`;
              }}
              className="px-4 py-2"
            >
              Start
              <Play className="ml-2 h-4 w-4" />
            </LiquidGlassButton>
          </div>
        </div>
      </div>
    </article>
  );
}

function LearnPanel({
  data,
  onClose,
}: {
  data: LearnTopicResponse;
  onClose: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 p-7 shadow-[0_0_40px_var(--cf-glow)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_35%)]" />

      <div className="relative">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--cf-accent)]">
              <GraduationCap className="h-4 w-4" />
              Learn Mode
            </div>

            <h2 className="mt-5 text-3xl font-black text-[var(--cf-text)]">
              {data.title}
            </h2>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {data.explanation}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-2 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <MiniList title="Key points" items={data.key_points} />
          <MiniList title="Common mistakes" items={data.common_mistakes} />
          <MiniList title="Proof requirements" items={data.proof_requirements} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <InfoBlock title="Mini example" text={data.mini_example} />
          <InfoBlock title="Practice prompt" text={data.practice_prompt} />
        </div>
      </div>
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[24px] border border-[var(--cf-border)] bg-black/10 p-5">
      <h3 className="font-black text-[var(--cf-text)]">{title}</h3>

      <div className="mt-4 space-y-2">
        {items?.length ? (
          items.map((item, index) => (
            <p
              key={`${item}-${index}`}
              className="text-sm leading-6 text-[var(--cf-text-secondary)]"
            >
              • {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-[var(--cf-text-muted)]">No data.</p>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--cf-border)] bg-black/10 p-5">
      <h3 className="font-black text-[var(--cf-text)]">{title}</h3>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--cf-text-secondary)]">
        {text || "No data."}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4">
      <p className="text-xs text-[var(--cf-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--cf-text)]">{value}</p>
    </div>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "rounded-full border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-3 py-1 text-xs font-black text-[var(--cf-text-secondary)]",
        className,
      ].join(" ")}
    >
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

function PracticeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-80 animate-pulse rounded-2xl bg-[var(--cf-card)]" />
      <div className="h-72 animate-pulse rounded-[38px] bg-[var(--cf-card)]" />
      <div className="h-96 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
    </div>
  );
}

function getTierConfig(tier: string) {
  if (tier === "high") {
    return {
      cardClass: "border-rose-500/25 bg-rose-500/10",
      badgeClass: "border-rose-500/25 bg-rose-500/10 text-rose-300",
    };
  }

  if (tier === "medium") {
    return {
      cardClass: "border-amber-500/25 bg-amber-500/10",
      badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    };
  }

  if (tier === "good") {
    return {
      cardClass: "border-emerald-500/20 bg-emerald-500/8",
      badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (tier === "master") {
    return {
      cardClass: "border-yellow-400/25 bg-yellow-400/8",
      badgeClass: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
    };
  }

  return {
    cardClass: "border-[var(--cf-border)] bg-[var(--cf-card)]",
    badgeClass:
      "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]",
  };
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSkill(value?: string | null) {
  return format(value);
}