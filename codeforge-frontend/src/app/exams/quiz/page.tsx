"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, ListChecks, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import { getSelectedGoalId } from "@/lib/selected-goal";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
};

type QuizGenerateResponse = {
  title: string;
  skill_name: string;
  question_count: number;
  max_points: number;
  questions: QuizQuestion[];
};

type AllowedLanguagesResponse = {
  subscription_tier: string;
  languages: string[];
  custom_language_allowed: boolean;
};

const QUESTION_COUNTS = [5, 10, 15];

const FALLBACK_LANGUAGES: AllowedLanguagesResponse = {
  subscription_tier: "free",
  languages: ["Python", "Java", "JavaScript"],
  custom_language_allowed: false,
};

export default function QuizGeneratePage() {
  const router = useRouter();

  const [skillName, setSkillName] = useState("");
  const [language, setLanguage] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [allowedLanguages, setAllowedLanguages] =
    useState<AllowedLanguagesResponse>(FALLBACK_LANGUAGES);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadAllowedLanguages() {
    try {
      const response = await api.get("/goals/allowed-languages");
      setAllowedLanguages(response.data || FALLBACK_LANGUAGES);
    } catch {
      setAllowedLanguages(FALLBACK_LANGUAGES);
    }
  }

  useEffect(() => {
    loadAllowedLanguages();

    const raw = sessionStorage.getItem("codeforge_quiz_retry");

    if (!raw) return;

    try {
      const retry = JSON.parse(raw);

      setSkillName(retry.skill_name || "");
      setLanguage(retry.language || "");
      setQuestionCount(retry.question_count || 5);
    } finally {
      sessionStorage.removeItem("codeforge_quiz_retry");
    }
  }, []);

  async function generateQuiz() {
    const goalId = getSelectedGoalId();

    if (!goalId) {
      setError("Select a goal first.");
      return;
    }

    if (skillName.trim().length < 2) {
      setError("Enter a skill name.");
      return;
    }

    try {
      setGenerating(true);
      setError("");

      const response = await api.post<QuizGenerateResponse>(
        "/exams/quiz/generate",
        {
          goal_id: goalId,
          skill_name: skillName.trim(),
          language: language.trim() || null,
          question_count: questionCount,
        }
      );

      sessionStorage.setItem(
        "codeforge_quiz_session",
        JSON.stringify(response.data)
      );

      router.push("/exams/quiz/session");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to generate quiz.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="space-y-8">
      <header>
        <button
          onClick={() => router.push("/exams")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--cf-text-muted)] transition hover:text-[var(--cf-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </button>

        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Quiz generator
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--cf-text)]">
          Build a checkpoint quiz
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Choose a skill and question count. CodeForge generates a focused quiz
          from your current learning context.
        </p>
      </header>

      {error ? <ErrorBox text={error} /> : null}

      <section className="relative overflow-hidden rounded-[38px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%)]" />

        <div className="relative grid gap-7 xl:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-5">
            <InfoCard
              icon={<Brain className="h-5 w-5" />}
              title="Quiz purpose"
              text="Quizzes test understanding before heavier execution. They affect streak and give points based on score."
            />

            <InfoCard
              icon={<ListChecks className="h-5 w-5" />}
              title="Question flow"
              text="During the session, you answer one question per screen and can move back before final submit."
            />
          </aside>

          <section className="space-y-6">
            <div>
              <Label>Skill name</Label>
              <input
                value={skillName}
                onChange={(event) => setSkillName(event.target.value)}
                placeholder="Example: strings, functions, FastAPI routing..."
                className="mt-3 w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
              />
            </div>

            <LanguageSelector
              value={language}
              languages={allowedLanguages.languages}
              customAllowed={allowedLanguages.custom_language_allowed}
              tier={allowedLanguages.subscription_tier}
              onChange={setLanguage}
            />

            <div>
              <Label>Question count</Label>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {QUESTION_COUNTS.map((count) => {
                  const active = questionCount === count;
                  const points = count === 5 ? 35 : count === 10 ? 70 : 100;

                  return (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={[
                        "rounded-3xl border p-5 text-left transition-all duration-300",
                        active
                          ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/12 text-[var(--cf-text)] shadow-[0_0_30px_var(--cf-glow)]"
                          : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/30",
                      ].join(" ")}
                    >
                      <p className="text-2xl font-black">{count}</p>
                      <p className="mt-1 text-sm text-[var(--cf-text-muted)]">
                        {points} pts max
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <LiquidGlassButton
              onClick={generateQuiz}
              disabled={generating}
              className="min-w-[220px] justify-center"
            >
              {generating ? "Generating..." : "Generate quiz"}
              <Sparkles className="ml-2 h-4 w-4" />
            </LiquidGlassButton>
          </section>
        </div>
      </section>
    </main>
  );
}

function LanguageSelector({
  value,
  languages,
  customAllowed,
  tier,
  onChange,
}: {
  value: string;
  languages: string[];
  customAllowed: boolean;
  tier: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>Language / stack</Label>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {languages.map((item) => {
          const active = value.toLowerCase() === item.toLowerCase();

          return (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={[
                "rounded-3xl border p-4 text-left transition-all duration-300",
                active
                  ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/12 text-[var(--cf-text)] shadow-[0_0_30px_var(--cf-glow)]"
                  : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-[var(--cf-text-secondary)] hover:border-[var(--cf-primary)]/30",
              ].join(" ")}
            >
              <p className="font-black">{item}</p>
              <p className="mt-1 text-xs text-[var(--cf-text-muted)]">
                Available on {format(tier)}
              </p>
            </button>
          );
        })}
      </div>

      {customAllowed ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Or type any language..."
          className="mt-3 w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-5 py-4 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] hover:border-[var(--cf-primary)]/30 focus:border-[var(--cf-primary)]/50"
        />
      ) : (
        <p className="mt-3 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-sm text-[var(--cf-text-secondary)]">
          Custom quiz languages unlock on Ultra.
        </p>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]">
          {icon}
        </div>
        <h3 className="font-black text-[var(--cf-text)]">{title}</h3>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--cf-text-secondary)]">
        {text}
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--cf-text-secondary)]">
      {children}
    </p>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {text}
    </div>
  );
}

function format(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}