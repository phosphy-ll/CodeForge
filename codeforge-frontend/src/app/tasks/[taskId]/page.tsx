"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Code2,
  FileText,
  LinkIcon,
  MessageSquare,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

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

type Submission = {
  id: number;
  task_id: number;
  user_id: number;
  attempt_number: number;
  content_text: string | null;
  content_code: string | null;
  content_link: string | null;
  score: number | null;
  earned_points: number;
  status: string;
  reviewer_type: string | null;
  feedback: string | null;
  why_not_verified?: string | null;
  improvement_steps?: string | null;
  suspicion_score: number | null;
  followup_question: string | null;
  followup_answer: string | null;
  reviewed_at: string | null;
  manual_review_requested: boolean;
  created_at: string;
};

type Precheck = {
  can_submit: boolean;
  confidence_score: number;
  confidence_label: string;
  rejection_risk: string;
  likely_issues: string[];
  tips: string[];
};

type LearnTask = {
  title: string;
  explanation: string;
  key_points: string[];
  common_mistakes: string[];
  mini_example: string;
  practice_prompt: string;
  proof_requirements: string[];
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = Number(params.taskId);

  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [learn, setLearn] = useState<LearnTask | null>(null);
  const [learning, setLearning] = useState(false);

  const [contentText, setContentText] = useState("");
  const [contentCode, setContentCode] = useState("");
  const [contentLink, setContentLink] = useState("");

  const [precheck, setPrecheck] = useState<Precheck | null>(null);
  const [prechecking, setPrechecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [followupAnswers, setFollowupAnswers] = useState<Record<number, string>>({});
  const [answeringFollowupId, setAnsweringFollowupId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const hasContent = useMemo(() => {
    return Boolean(contentText.trim() || contentCode.trim() || contentLink.trim());
  }, [contentText, contentCode, contentLink]);

  const latestSubmission = submissions[0] ?? null;

  const canSubmit =
    task &&
    !["locked", "verified", "submitted", "skipped"].includes(task.status);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [taskResponse, submissionsResponse] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/submissions/task/${taskId}`),
      ]);

      setTask(taskResponse.data);

      const loadedSubmissions = Array.isArray(submissionsResponse.data)
        ? submissionsResponse.data
        : [];

      setSubmissions(
        [...loadedSubmissions].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load task.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (taskId) load();
  }, [taskId]);

  async function handleLearnTask() {
    try {
      setLearning(true);
      setError(null);

      const response = await api.post(`/ai/learn-task/${taskId}`);
      setLearn(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load learn mode.");
    } finally {
      setLearning(false);
    }
  }

  async function handlePrecheck() {
    if (!hasContent) {
      setError("Add text, code, or link before precheck.");
      return;
    }

    try {
      setPrechecking(true);
      setError(null);

      const response = await api.post("/submissions/precheck", {
        task_id: taskId,
        content_text: contentText.trim() || null,
        content_code: contentCode.trim() || null,
        content_link: contentLink.trim() || null,
      });

      setPrecheck(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Precheck failed.");
    } finally {
      setPrechecking(false);
    }
  }

  async function handleSubmit() {
    if (!hasContent) {
      setError("Add text, code, or link before submit.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.post("/submissions", {
        task_id: taskId,
        content_text: contentText.trim() || null,
        content_code: contentCode.trim() || null,
        content_link: contentLink.trim() || null,
      });

      setContentText("");
      setContentCode("");
      setContentLink("");
      setPrecheck(null);

      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnswerFollowup(submissionId: number) {
    const answer = followupAnswers[submissionId]?.trim();

    if (!answer) {
      setError("Write a follow-up answer first.");
      return;
    }

    try {
      setAnsweringFollowupId(submissionId);
      setError(null);

      await api.post(`/submissions/${submissionId}/answer-followup`, {
        answer,
      });

      setFollowupAnswers((prev) => ({ ...prev, [submissionId]: "" }));
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Follow-up answer failed.");
    } finally {
      setAnsweringFollowupId(null);
    }
  }

  if (loading) {
    return <TaskSkeleton />;
  }

  if (!task) {
    return (
      <main className="rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8">
        <h1 className="text-2xl font-black text-[var(--cf-text)]">Task not found</h1>
        <div className="mt-6">
          <LiquidGlassButton onClick={() => router.push("/today")}>
            Back to Today
          </LiquidGlassButton>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <button
        onClick={() => router.push("/today")}
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--cf-text-muted)] transition hover:text-[var(--cf-accent)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Today
      </button>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.16),transparent_35%)]" />

        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={task.status} />
              <Badge>{format(task.task_type)}</Badge>
              <Badge>{format(task.verification_type)}</Badge>
              <Badge>{task.is_required ? "Required" : "Optional"}</Badge>
            </div>

            <h1 className="mt-5 max-w-5xl text-4xl font-black tracking-tight text-[var(--cf-text)]">
              {task.title}
            </h1>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--cf-text-secondary)]">
              {task.description || "No description. Execute with clear proof."}
            </p>

            {task.status === "locked" && task.unlock_condition_text ? (
              <div className="mt-5 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-sm text-[var(--cf-text-secondary)]">
                Locked: {task.unlock_condition_text}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Info label="Difficulty" value={task.difficulty ? `${task.difficulty}/5` : "—"} />
              <Info label="Time" value={task.estimated_minutes ? `${task.estimated_minutes} min` : "—"} />
              <Info label="Reward" value={`${task.reward_points} pts`} />
              <Info label="Required score" value={`${task.required_score}%`} />
              <Info label="Attempts" value={`${submissions.length}/${task.max_attempts}`} />
            </div>
          </div>

          <div className="w-full rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5 xl:w-[320px]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--cf-accent)]" />
              <h2 className="text-lg font-black text-[var(--cf-text)]">
                Execution state
              </h2>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--cf-text-secondary)]">
              {getStateMessage(task.status)}
            </p>

            {latestSubmission ? (
              <div className="mt-5 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-card)] p-4">
                <p className="text-xs text-[var(--cf-text-muted)]">Latest result</p>
                <p className="mt-1 text-xl font-black text-[var(--cf-text)]">
                  {latestSubmission.score ?? "—"}%
                </p>
                <p className="mt-1 text-xs text-[var(--cf-text-secondary)]">
                  {format(latestSubmission.status)} • {latestSubmission.earned_points} pts
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-[var(--cf-accent)]" />
            <h2 className="text-2xl font-black text-[var(--cf-text)]">
              Understand first
            </h2>
          </div>

          <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
            Use Learn Mode before execution. Copy-paste progress gets caught.
            Understanding must survive review.
          </p>

          <div className="mt-5">
            <LiquidGlassButton onClick={handleLearnTask} disabled={learning}>
              {learning ? "Loading learn mode..." : "Open Learn Mode"}
              <Sparkles className="ml-2 h-4 w-4" />
            </LiquidGlassButton>
          </div>

          {learn ? <LearnCard learn={learn} /> : null}
        </section>

        <section className="rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[var(--cf-accent)]" />
            <h2 className="text-2xl font-black text-[var(--cf-text)]">
              Proof requirements
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            <Requirement icon={<FileText className="h-4 w-4" />} text="Explain what you did and why it works." />
            <Requirement icon={<Code2 className="h-4 w-4" />} text="Submit code if the task requires implementation proof." />
            <Requirement icon={<ShieldQuestion className="h-4 w-4" />} text="Be ready to answer follow-up questions if proof looks weak." />
          </div>
        </section>
      </section>

      {canSubmit ? (
        <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-[var(--cf-accent)]" />
            <h2 className="text-2xl font-black text-[var(--cf-text)]">
              Submit proof
            </h2>
          </div>

          <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
            Weak proof wastes attempts. Precheck first, then submit.
          </p>

          <div className="mt-6 grid gap-5">
            <ProofTextarea
              label="Explanation"
              icon={<FileText className="h-4 w-4" />}
              value={contentText}
              onChange={(value) => {
                setContentText(value);
                setPrecheck(null);
              }}
              rows={6}
              placeholder="Explain what you did, what you learned, and why your solution works."
            />

            <ProofTextarea
              label="Code"
              icon={<Code2 className="h-4 w-4" />}
              value={contentCode}
              onChange={(value) => {
                setContentCode(value);
                setPrecheck(null);
              }}
              rows={9}
              placeholder="Paste code proof here."
              mono
            />

            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--cf-text)]">
                <LinkIcon className="h-4 w-4 text-[var(--cf-accent)]" />
                Link
              </label>
              <input
                value={contentLink}
                onChange={(e) => {
                  setContentLink(e.target.value);
                  setPrecheck(null);
                }}
                placeholder="Optional: GitHub, demo, docs, screenshot link..."
                className="w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
              />
            </div>

            {precheck ? <PrecheckCard data={precheck} /> : null}

            <div className="flex flex-wrap gap-3">
              <LiquidGlassButton
                onClick={handlePrecheck}
                disabled={!hasContent || prechecking}
              >
                {prechecking ? "Checking..." : "Precheck proof"}
              </LiquidGlassButton>

              <LiquidGlassButton
                onClick={handleSubmit}
                disabled={!hasContent || submitting}
              >
                {submitting ? "Submitting..." : "Submit for verification"}
              </LiquidGlassButton>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
          <h2 className="text-xl font-black text-[var(--cf-text)]">
            Submission closed
          </h2>
          <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">
            Current status: {format(task.status)}.
          </p>
        </section>
      )}

      <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-[var(--cf-accent)]" />
          <h2 className="text-2xl font-black text-[var(--cf-text)]">
            Submission history
          </h2>
        </div>

        {submissions.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--cf-text-secondary)]">
            No submissions yet. Execute and submit proof.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                answer={followupAnswers[submission.id] || ""}
                answering={answeringFollowupId === submission.id}
                onAnswerChange={(value) =>
                  setFollowupAnswers((prev) => ({
                    ...prev,
                    [submission.id]: value,
                  }))
                }
                onSubmitAnswer={() => handleAnswerFollowup(submission.id)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function LearnCard({ learn }: { learn: LearnTask }) {
  return (
    <div className="mt-6 rounded-[28px] border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/8 p-5">
      <h3 className="text-xl font-black text-[var(--cf-text)]">{learn.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
        {learn.explanation}
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ListBlock title="Key points" items={learn.key_points} />
        <ListBlock title="Common mistakes" items={learn.common_mistakes} />
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
        <p className="text-sm font-black text-[var(--cf-text)]">Mini example</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--cf-text-secondary)]">
          {learn.mini_example}
        </p>
      </div>

      <div className="mt-5">
        <ListBlock title="Proof requirements" items={learn.proof_requirements} />
      </div>
    </div>
  );
}

function SubmissionCard({
  submission,
  answer,
  answering,
  onAnswerChange,
  onSubmitAnswer,
}: {
  submission: Submission;
  answer: string;
  answering: boolean;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
}) {
  const needsFollowup =
    submission.followup_question &&
    submission.status !== "verified" &&
    !submission.followup_answer;

  return (
    <article className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--cf-text-muted)]">
            Attempt #{submission.attempt_number}
          </p>
          <h3 className="mt-1 text-xl font-black text-[var(--cf-text)]">
            {format(submission.status)}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>Score: {submission.score ?? "—"}</Badge>
          <Badge>Earned: {submission.earned_points}</Badge>
          <Badge>Suspicion: {submission.suspicion_score ?? 0}</Badge>
        </div>
      </div>

      {submission.feedback ? (
        <p className="mt-4 text-sm leading-7 text-[var(--cf-text-secondary)]">
          {submission.feedback}
        </p>
      ) : null}

      {submission.why_not_verified ? (
        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-sm font-black text-amber-300">Why not verified</p>
          <p className="mt-2 text-sm leading-7 text-[var(--cf-text-secondary)]">
            {submission.why_not_verified}
          </p>
        </div>
      ) : null}

      {submission.followup_question ? (
        <div className="mt-4 rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/8 p-4">
          <p className="text-sm font-black text-[var(--cf-text)]">
            Follow-up question
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--cf-text-secondary)]">
            {submission.followup_question}
          </p>

          {submission.followup_answer ? (
            <p className="mt-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-card)] p-3 text-sm text-[var(--cf-text-secondary)]">
              Answered: {submission.followup_answer}
            </p>
          ) : null}

          {needsFollowup ? (
            <div className="mt-4 space-y-3">
              <textarea
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                rows={4}
                placeholder="Answer directly. Vague answers will not pass."
                className="w-full resize-none rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-card)] px-4 py-3 text-[var(--cf-text)] outline-none placeholder:text-[var(--cf-text-muted)] focus:border-[var(--cf-primary)]/50"
              />
              <LiquidGlassButton onClick={onSubmitAnswer} disabled={answering}>
                {answering ? "Submitting answer..." : "Submit follow-up answer"}
              </LiquidGlassButton>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function PrecheckCard({ data }: { data: Precheck }) {
  const danger = !data.can_submit || data.rejection_risk === "high";

  return (
    <div
      className={[
        "rounded-[28px] border p-5",
        danger
          ? "border-amber-500/25 bg-amber-500/10"
          : "border-emerald-500/20 bg-emerald-500/10",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        {danger ? (
          <AlertTriangle className="h-5 w-5 text-amber-300" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
        )}
        <h3 className="text-lg font-black text-[var(--cf-text)]">
          Precheck result
        </h3>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Info label="Can submit" value={data.can_submit ? "Yes" : "No"} />
        <Info label="Confidence" value={`${Math.round(data.confidence_score * 100)}%`} />
        <Info label="Risk" value={format(data.rejection_risk)} />
      </div>

      {data.likely_issues?.length ? (
        <ListBlock title="Likely issues" items={data.likely_issues} />
      ) : null}

      {data.tips?.length ? <ListBlock title="Tips" items={data.tips} /> : null}
    </div>
  );
}

function ProofTextarea({
  label,
  icon,
  value,
  onChange,
  rows,
  placeholder,
  mono = false,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--cf-text)]">
        <span className="text-[var(--cf-accent)]">{icon}</span>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={[
          "w-full resize-none rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50",
          mono ? "font-mono text-sm" : "",
        ].join(" ")}
      />
    </div>
  );
}

function Requirement({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
      <span className="mt-0.5 text-[var(--cf-accent)]">{icon}</span>
      <p className="text-sm leading-6 text-[var(--cf-text-secondary)]">{text}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5">
      <p className="text-sm font-black text-[var(--cf-text)]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--cf-text-secondary)]">
        {items.map((item, index) => (
          <li key={index}>• {item}</li>
        ))}
      </ul>
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-3 py-1 text-xs font-bold text-[var(--cf-text-secondary)]">
      {children}
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
      : status === "locked"
      ? "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-muted)]"
      : "border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {format(status)}
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

function TaskSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-56 animate-pulse rounded-2xl bg-[var(--cf-card)]" />
      <div className="h-64 animate-pulse rounded-[34px] bg-[var(--cf-card)]" />
      <div className="h-80 animate-pulse rounded-[34px] bg-[var(--cf-card)]" />
    </div>
  );
}

function getStateMessage(status: string) {
  if (status === "verified") return "Verified. This task counted toward real progress.";
  if (status === "submitted") return "Submitted. Wait for review or check feedback.";
  if (status === "needs_revision") return "Needs revision. Fix weak proof and submit again.";
  if (status === "failed") return "Execution failed. Retry with stronger proof.";
  if (status === "locked") return "Locked. Complete prerequisite work first.";
  return "Available. Learn, execute, precheck, then submit proof.";
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}