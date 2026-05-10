"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Gauge,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type CoachAction = {
  type: string;
  title: string;
  reason: string;
};

type CoachChatMessage = {
  role: "user" | "coach";
  content: string;
  suggested_actions?: string[];
};

type CoachChatResponse = {
  answer: string;
  suggested_actions: string[];
};

type CoachResponse = {
  summary: string;
  severity: string;
  weak_areas: string[];
  strengths: string[];
  diagnosis: string;
  next_actions: CoachAction[];
  recommended_focus: string;
  warning: string | null;
  pressure_message: string;
  execution_risk: string;
};

export default function AICoachPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coach, setCoach] = useState<CoachResponse | null>(null);
  const [error, setError] = useState("");

  const [chatMessages, setChatMessages] = useState<CoachChatMessage[]>([
    {
      role: "coach",
      content:
        "Ask me what to do next, why your progress is weak, or how to fix your latest submission.",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  async function loadCoach(showRefresh = false) {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await api.post("/ai/coach", {});
      setCoach(response.data || null);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Failed to generate AI coach analysis."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function askCoach() {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    setChatMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: message,
      },
    ]);

    setChatInput("");
    setChatLoading(true);

    try {
      const response = await api.post<CoachChatResponse>("/ai/coach/chat", {
        message,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content: response.data.answer,
          suggested_actions: response.data.suggested_actions || [],
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content:
            err?.response?.data?.detail ||
            "Coach chat failed. Try again or refresh the analysis.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    loadCoach();
  }, []);

  const severityConfig = useMemo(() => {
    const severity = coach?.severity?.toLowerCase();

    if (severity === "high") {
      return {
        label: "High execution risk",
        color:
          "border-rose-500/25 bg-rose-500/10 text-rose-300 shadow-[0_0_40px_rgba(244,63,94,0.18)]",
        icon: <TriangleAlert className="h-5 w-5" />,
      };
    }

    if (severity === "medium") {
      return {
        label: "Moderate execution risk",
        color:
          "border-amber-500/25 bg-amber-500/10 text-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.12)]",
        icon: <AlertTriangle className="h-5 w-5" />,
      };
    }

    return {
      label: "Stable execution state",
      color:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.12)]",
      icon: <ShieldAlert className="h-5 w-5" />,
    };
  }, [coach]);

  if (loading) {
    return <CoachSkeleton />;
  }

  return (
    <main className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            AI Coach
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
            Execution diagnosis
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            CodeForge analyzes your execution patterns, pressure level,
            strengths, weak areas, and progression risk.
          </p>
        </div>

        <LiquidGlassButton
          onClick={() => loadCoach(true)}
          disabled={refreshing}
          className="min-w-[240px] justify-center"
        >
          {refreshing ? "Reanalyzing..." : "Refresh analysis"}
        </LiquidGlassButton>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      {coach ? (
        <>
          <section
            className={[
              "relative overflow-hidden rounded-[38px] border p-7",
              severityConfig.color,
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />

            <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
                  {severityConfig.icon}
                  {severityConfig.label}
                </div>

                <h2 className="mt-6 max-w-4xl text-3xl font-black leading-tight tracking-tight text-[var(--cf-text)] xl:text-4xl">
                  {shorten(coach.pressure_message, 180)}
                </h2>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
                  {coach.summary}
                </p>
              </div>

              <div className="self-start rounded-[26px] border border-white/10 bg-black/15 p-5 backdrop-blur-xl xl:max-w-[460px]">
                <div className="flex items-center gap-3">
                  <Gauge className="h-5 w-5 text-[var(--cf-accent)]" />

                  <h3 className="text-xl font-black text-[var(--cf-text)]">
                    Execution risk
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-7 text-[var(--cf-text-secondary)]">
                  {formatExecutionRisk(coach.execution_risk)}
                </p>

                {coach.warning ? (
                  <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-7 text-amber-200">
                    {coach.warning}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[36px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.14),transparent_35%)]" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]">
                  <Brain className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight text-[var(--cf-text)]">
                    Ask the coach
                  </h2>

                  <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">
                    Get direct execution advice based on your recent proof and
                    weak areas.
                  </p>
                </div>
              </div>

              <div className="coach-chat-scroll mt-6 max-h-[420px] space-y-4 overflow-y-auto pr-2">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={[
                      "rounded-[26px] border p-5",
                      message.role === "user"
                        ? "ml-auto max-w-[760px] border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10"
                        : "mr-auto max-w-[860px] border-[var(--cf-border)] bg-[var(--cf-bg-secondary)]",
                    ].join(" ")}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--cf-text-muted)]">
                      {message.role === "user" ? "You" : "Coach"}
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--cf-text-secondary)]">
                      {message.content}
                    </p>

                    {message.suggested_actions?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.suggested_actions.map(
                          (action, actionIndex) => (
                            <span
                              key={`${action}-${actionIndex}`}
                              className="rounded-full border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-3 py-1 text-xs font-black text-[var(--cf-accent)]"
                            >
                              {action}
                            </span>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}

                {chatLoading ? (
                  <div className="mr-auto max-w-[520px] rounded-[26px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5 text-sm text-[var(--cf-text-secondary)]">
                    Coach is analyzing...
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      askCoach();
                    }
                  }}
                  placeholder="Ask: what should I do next today?"
                  className="min-h-[52px] flex-1 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 text-sm text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
                />

                <LiquidGlassButton
                  onClick={askCoach}
                  disabled={chatLoading || !chatInput.trim()}
                >
                  {chatLoading ? "Asking..." : "Ask coach"}
                  <Zap className="ml-2 h-4 w-4" />
                </LiquidGlassButton>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5">
              <GlassCard title="Diagnosis" icon={<Brain className="h-5 w-5" />}>
                <p className="text-sm leading-7 text-[var(--cf-text-secondary)]">
                  {coach.diagnosis}
                </p>
              </GlassCard>

              <GlassCard
                title="Recommended focus"
                icon={<Target className="h-5 w-5" />}
              >
                <p className="text-sm leading-7 text-[var(--cf-text-secondary)]">
                  {coach.recommended_focus}
                </p>
              </GlassCard>

              <GlassCard
                title="Strengths"
                icon={<TrendingUp className="h-5 w-5" />}
              >
                {coach.strengths.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {coach.strengths.map((strength, index) => (
                      <Badge key={`${strength}-${index}`} color="emerald">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="No strengths detected yet." />
                )}
              </GlassCard>

              <GlassCard
                title="Weak areas"
                icon={<TriangleAlert className="h-5 w-5" />}
              >
                {coach.weak_areas.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {coach.weak_areas.map((weakness, index) => (
                      <Badge key={`${weakness}-${index}`} color="rose">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="No major weaknesses detected." />
                )}
              </GlassCard>
            </div>

            <GlassCard title="Execution actions" icon={<Zap className="h-5 w-5" />}>
              <div className="space-y-4">
                {coach.next_actions.length > 0 ? (
                  coach.next_actions.map((action, index) => (
                    <div
                      key={`${action.title}-${index}`}
                      className="group relative overflow-hidden rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5 transition-all duration-300 hover:border-[var(--cf-primary)]/35 hover:bg-[var(--cf-primary)]/8"
                    >
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
                      </div>

                      <div className="relative">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge color="violet">{format(action.type)}</Badge>
                        </div>

                        <h3 className="mt-4 text-xl font-black tracking-tight text-[var(--cf-text)]">
                          {action.title}
                        </h3>

                        <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
                          {action.reason}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyText text="No actions generated." />
                )}
              </div>
            </GlassCard>
          </section>

          <section className="relative overflow-hidden rounded-[36px] border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 p-7 shadow-[0_0_40px_var(--cf-glow)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_35%)]" />

            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[var(--cf-accent)]" />

                  <h2 className="text-2xl font-black text-[var(--cf-text)]">
                    AI pressure insight
                  </h2>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
                  The coach does not optimize for comfort. It optimizes for
                  execution consistency and measurable skill growth.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <MiniMetric label="Severity" value={severityConfig.label} />
                <MiniMetric
                  label="Weak areas"
                  value={String(coach.weak_areas.length)}
                />
                <MiniMetric
                  label="Actions"
                  value={String(coach.next_actions.length)}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}

      <style jsx global>{`
        .coach-chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.45)
            rgba(255, 255, 255, 0.04);
        }

        .coach-chat-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .coach-chat-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
        }

        .coach-chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.45);
          border-radius: 999px;
        }

        .coach-chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.65);
        }
      `}</style>
    </main>
  );
}

function GlassCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.12),transparent_35%)]" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]">
            {icon}
          </div>

          <h2 className="text-2xl font-black tracking-tight text-[var(--cf-text)]">
            {title}
          </h2>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "emerald" | "rose" | "violet";
}) {
  const styles =
    color === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : color === "rose"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
      : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]";

  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-xs font-black",
        styles,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-5 py-4 backdrop-blur-xl">
      <p className="text-xs text-[var(--cf-text-muted)]">{label}</p>

      <p className="mt-2 text-lg font-black text-[var(--cf-text)]">
        {value}
      </p>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-[var(--cf-text-muted)]">{text}</p>;
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {text}
    </div>
  );
}

function CoachSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-72 animate-pulse rounded-2xl bg-[var(--cf-card)]" />
      <div className="h-72 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
        <div className="h-96 animate-pulse rounded-[36px] bg-[var(--cf-card)]" />
      </div>
    </div>
  );
}

function format(value?: string | null) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shorten(value: string, maxLength: number) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function formatExecutionRisk(value?: string | null) {
  if (!value) return "No execution risk detected yet.";

  const normalized = value.toLowerCase().trim();

  if (normalized === "high") {
    return "High risk. Recent proof shows weak execution quality. Fix the latest submission before stacking more tasks.";
  }

  if (normalized === "medium") {
    return "Medium risk. Progress exists, but consistency and proof quality still need work.";
  }

  if (normalized === "low") {
    return "Low risk. Execution is currently stable, but CodeForge will keep monitoring proof quality.";
  }

  return value;
}