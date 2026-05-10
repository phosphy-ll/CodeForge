"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Sparkles,
} from "lucide-react";

import { api } from "@/lib/api";
import { getSelectedGoalId } from "@/lib/selected-goal";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
};

type QuizSession = {
  title: string;
  skill_name: string;
  question_count: number;
  max_points: number;
  questions: QuizQuestion[];
};

type SubmitResponse = {
  attempt: {
    score: number;
    earned_points: number;
    status: string;
    feedback: string;
  };
  attempts_used: number;
  attempts_allowed: number;
  can_retry: boolean;
};

export default function QuizSessionPage() {
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("codeforge_quiz_session");

    if (!raw) {
      router.push("/exams/quiz");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setQuiz(parsed);
    } catch {
      router.push("/exams/quiz");
    }
  }, [router]);

  const question = useMemo(() => {
    if (!quiz) return null;
    return quiz.questions[currentQuestion];
  }, [quiz, currentQuestion]);

  function selectAnswer(option: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: option,
    }));
  }

  function nextQuestion() {
    if (!quiz) return;

    setCurrentQuestion((prev) =>
      Math.min(prev + 1, quiz.questions.length - 1)
    );
  }

  function previousQuestion() {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  }

  async function submitQuiz() {
    if (!quiz) return;

    const goalId = getSelectedGoalId();

    if (!goalId) return;

    try {
      setSubmitting(true);

      let correctCount = 0;

      quiz.questions.forEach((q, index) => {
        if (answers[index] === q.correct_answer) {
          correctCount += 1;
        }
      });

      const response = await api.post<SubmitResponse>(
        "/exams/quiz/submit",
        {
          goal_id: goalId,
          skill_name: quiz.skill_name,
          question_count: quiz.question_count,
          correct_count: correctCount,
        }
      );

      setResult(response.data);

    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  if (!quiz || !question) {
    return null;
  }

  if (result) {
    return (
      <main className="space-y-8">
        <header>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            Quiz completed
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
            {quiz.title}
          </h1>
        </header>

        <section className="relative overflow-hidden rounded-[40px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.2),transparent_35%)]" />

          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_24px_var(--cf-glow)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm text-[var(--cf-text-muted)]">
                  Final score
                </p>

                <h2 className="text-5xl font-black text-[var(--cf-text)]">
                  {result.attempt.score}%
                </h2>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <ResultCard
                label="Earned points"
                value={`${result.attempt.earned_points}`}
              />

              <ResultCard
                label="Status"
                value={result.attempt.status}
              />

              <ResultCard
                label="Attempts"
                value={`${result.attempts_used}/${result.attempts_allowed}`}
              />
            </div>

            <div className="mt-7 rounded-3xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
              <p className="text-sm leading-7 text-[var(--cf-text-secondary)]">
                {result.attempt.feedback}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              {result.can_retry ? (
                <LiquidGlassButton
                  onClick={() => {
                    sessionStorage.setItem(
                      "codeforge_quiz_session",
                      JSON.stringify(quiz)
                    );

                    window.location.href = "/exams/quiz/session";
                  }}
                >
                  Retry quiz
                  <Sparkles className="ml-2 h-4 w-4" />
                </LiquidGlassButton>
              ) : null}

              <button
                onClick={() => router.push("/exams")}
                className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-6 py-4 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-text)]"
              >
                Back to exams
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const progress =
    ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <button
            onClick={() => router.push("/exams/quiz")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--cf-text-muted)] transition hover:text-[var(--cf-accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit quiz
          </button>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
            Quiz session
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
            {quiz.title}
          </h1>
        </div>

        <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-card)] px-5 py-4">
          <p className="text-xs text-[var(--cf-text-muted)]">
            Question
          </p>

          <p className="mt-1 text-2xl font-black text-[var(--cf-text)]">
            {currentQuestion + 1}/{quiz.questions.length}
          </p>
        </div>
      </header>

      <section className="rounded-[34px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-2">
        <div className="h-3 overflow-hidden rounded-full bg-[var(--cf-bg-secondary)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7C5CFF,#A78BFA,#C4B5FD)] transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[40px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative">
          <div className="flex items-center gap-3 text-[var(--cf-accent)]">
            <Flame className="h-5 w-5" />

            <p className="text-sm font-black uppercase tracking-[0.18em]">
              Question {currentQuestion + 1}
            </p>
          </div>

          <h2 className="mt-5 text-3xl font-black leading-tight text-[var(--cf-text)]">
            {question.question}
          </h2>

          <div className="mt-8 grid gap-4">
            {question.options.map((option) => {
              const selected = answers[currentQuestion] === option;

              return (
                <button
                  key={option}
                  onClick={() => selectAnswer(option)}
                  className={[
                    "group relative overflow-hidden rounded-[30px] border p-5 text-left transition-all duration-300",
                    selected
                      ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/12 text-[var(--cf-text)] shadow-[0_0_30px_var(--cf-glow)]"
                      : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/30 hover:text-[var(--cf-text)]",
                  ].join(" ")}
                >
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-1/3 top-[-50%] h-[220%] w-[40%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
                  </div>

                  <div className="relative flex items-center justify-between gap-4">
                    <p className="text-sm font-bold leading-7">
                      {option}
                    </p>

                    <div
                      className={[
                        "h-5 w-5 rounded-full border transition",
                        selected
                          ? "border-[var(--cf-accent)] bg-[var(--cf-accent)]"
                          : "border-[var(--cf-border)]",
                      ].join(" ")}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--cf-border)] pt-6">
            <button
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className={[
                "rounded-2xl border px-5 py-3 text-sm font-bold transition",
                currentQuestion === 0
                  ? "cursor-not-allowed border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-muted)] opacity-45"
                  : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/35 hover:text-[var(--cf-accent)]",
              ].join(" ")}
            >
              Previous
            </button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <LiquidGlassButton onClick={nextQuestion}>
                Next question
                <ArrowRight className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            ) : (
              <LiquidGlassButton
                onClick={submitQuiz}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit quiz"}
                <Sparkles className="ml-2 h-4 w-4" />
              </LiquidGlassButton>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--cf-text-muted)]">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black text-[var(--cf-text)]">
        {value}
      </p>
    </div>
  );
}