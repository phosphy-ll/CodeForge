"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const flowCards = [
  {
    number: "01",
    title: "Choose a goal",
    text: "Backend, Frontend, AI, Cybersecurity, or your own custom path.",
    visual: "goal",
  },
  {
    number: "02",
    title: "Get daily tasks",
    text: "CodeForge breaks your goal into small tasks you can actually finish every day.",
    visual: "tasks",
  },
  {
    number: "03",
    title: "Build proof",
    text: "Your progress is based on completed work, not saved videos or unfinished plans.",
    visual: "proof",
  },
];

const comparison = [
  ["Save tutorials", "❌"],
  ["Watch tutorials", "❌"],
  ["Plan tutorials", "❌"],
  ["Ship projects", "✅"],
  ["Build consistency", "✅"],
  ["Track proof", "✅"],
];

export default function LandingPage() {
  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050509] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.08),transparent_30%)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto grid max-w-7xl gap-14 px-4 pb-24 pt-12 sm:px-6 md:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pb-32 lg:pt-20">
          <Hero />
          <ProductFrame />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
          <div className="grid gap-4 lg:grid-cols-3">
            {flowCards.map((card, index) => (
              <FlowCard key={card.title} card={card} index={index} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-10 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="grid gap-8 rounded-[38px] border border-white/10 bg-white/[0.035] p-6 md:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">
                Proof-based execution
              </p>

              <h2 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Most developers already know what to learn.
                <br />
                The problem is execution.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/58">
                Most developers don't fail because of lack of knowledge.
                They fail because they stop executing.
              </p>
            </div>

            <div className="space-y-3">
              {comparison.map(([name, value], index) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  className={[
                    "flex items-center justify-between rounded-2xl border px-4 py-4 transition duration-300",
                    name === "CodeForge"
                      ? "border-violet-400/35 bg-violet-500/12 shadow-[0_0_28px_rgba(139,92,246,0.14)]"
                      : "border-white/10 bg-black/24 hover:border-white/16 hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <span className="text-sm font-black text-white">{name}</span>
                  <span className="text-sm font-bold text-white/55">
                    {value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-10 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-[42px] border border-violet-400/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.20),rgba(8,8,14,0.98))] px-6 py-14 text-center shadow-[0_0_70px_rgba(139,92,246,0.12)] md:px-10 md:py-20"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%)]" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/14 blur-2xl" />

            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">
                Founding beta
              </p>

              <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
                Most developers don't fail because of lack of knowledge.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/62">
                They fail because they stop executing.
                CodeForge helps you keep moving every day.
              </p>

              <div className="mt-8 flex justify-center">
                <PrimaryLink
                  href="/signup"
                  onClick={() => trackEvent("start_free_click")}
                >
                  Generate My Roadmap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </PrimaryLink>
              </div>

              <p className="mt-5 text-xs font-semibold tracking-[0.08em] text-white/36">
                AI roadmaps • Daily execution • Proof-based progress
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

function Navbar() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 md:px-10">
      <Link
        href="/"
        className="group flex items-center gap-3 transition hover:opacity-80"
      >
        <img
          src="/logo.svg"
          alt="CodeForge"
          className="h-[72px] w-[72px] rounded-2xl border border-violet-400/25 bg-white/[0.03] p-2 shadow-[0_0_28px_rgba(139,92,246,0.14)]"
        />

        <div>
          <p className="text-lg font-black tracking-tight">CodeForge</p>
          <p className="hidden text-xs text-white/40 sm:block">
            Structured execution for developers
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-white/65 transition hover:bg-white/[0.06] hover:text-white sm:block"
        >
          Login
        </Link>

        <PrimaryLink
          href="/signup"
          onClick={() => trackEvent("start_free_click")}
        >
          Generate My Roadmap
        </PrimaryLink>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">
        Beta access open
      </div>

      <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl md:text-7xl lg:text-[78px]">
        Stop collecting tutorials.
        <br />
        <span className="bg-gradient-to-r from-white via-violet-200 to-violet-500 bg-clip-text text-transparent">
          Start building projects.
        </span>
      </h1>

      <p className="mt-7 max-w-2xl text-base leading-8 text-white/60 md:text-lg">
        Turn any developer goal into an AI roadmap, daily tasks,
        and proof-based progress.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <PrimaryLink
          href="/signup"
          onClick={() => trackEvent("start_free_click")}
        >
          Generate My Roadmap
          <ArrowRight className="ml-2 h-4 w-4" />
        </PrimaryLink>

        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black text-white/60 transition duration-300 hover:-translate-y-[2px] hover:bg-white/[0.06] hover:text-white"
        >
          Login
        </Link>
      </div>

      <p className="mt-6 max-w-2xl pb-5 text-xs font-semibold leading-6 tracking-[0.08em] text-white/36">
        Backend • Frontend • AI • Cybersecurity • Python
      </p>
    </motion.div>
  );
}

function ProductFrame() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 16 }}
      animate={
        shouldReduceMotion
          ? { opacity: 1, scale: 1, y: 0 }
          : {
              opacity: 1,
              scale: 1,
              y: [0, -4, 0],
            }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.45 }
          : {
              opacity: { duration: 0.55 },
              scale: { duration: 0.55 },
              y: {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
      }
      className="relative will-change-transform lg:scale-[0.96]"
    >
      <div className="absolute -inset-8 rounded-[56px] bg-[radial-gradient(circle,rgba(139,92,246,0.20),transparent_62%)] blur-2xl" />

      <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[#0c0c14]/92 p-5 shadow-[0_26px_90px_rgba(0,0,0,0.58)] transition duration-500 hover:shadow-[0_32px_110px_rgba(139,92,246,0.14)]">
        <div className="rounded-[30px] border border-violet-400/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(8,8,14,0.98))] p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                Today
              </p>

              <h2 className="mt-2 text-3xl font-black">Backend roadmap</h2>
              <p className="mt-2 text-sm text-white/52">
                3 focused tasks prepared for today.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
                Proof
              </p>
              <p className="mt-1 text-2xl font-black">72%</p>
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "72%" }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            />
          </div>

          <div className="mt-6 space-y-3">
            {[
              ["Learn", "Refresh token flow", "In progress"],
              ["Code", "Build JWT authentication", "Verified"],
              ["Build", "Handle edge cases", "Queued"],
            ].map(([type, title, status], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.06, duration: 0.35 }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/24 px-4 py-4 transition hover:border-violet-400/25 hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-violet-200" />
                  <div>
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-1 text-xs text-white/42">{type} task</p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/65">
                  {status}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <PreviewStat label="Streak" value="12" />
            <PreviewStat label="Verified" value="28" />
            <PreviewStat label="Focus" value="AI" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FlowCard({
  card,
  index,
}: {
  card: {
    number: string;
    title: string;
    text: string;
    visual: string;
  };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ delay: index * 0.06, duration: 0.38 }}
      className={[
        "group relative overflow-hidden rounded-[34px]",
        "border border-white/10 bg-white/[0.035] p-7",
        "transition duration-300",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:rounded-[34px]",
        "before:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_38%)]",
        "before:opacity-0 before:transition before:duration-300",
        "hover:-translate-y-[4px]",
        "hover:border-violet-400/30",
        "hover:bg-white/[0.05]",
        "hover:shadow-[0_0_42px_rgba(139,92,246,0.09)]",
        "hover:before:opacity-100",
        card.visual === "tasks" ? "min-h-[520px]" : "min-h-[430px]",
      ].join(" ")}
    >
      <div className="relative z-10">
        <div
          className={[
            "flex items-center justify-center",
            card.visual === "tasks" ? "min-h-[320px]" : "h-56",
          ].join(" ")}
>
          {card.visual === "goal" ? <GoalVisual /> : null}
          {card.visual === "tasks" ? <TasksVisual /> : null}
          {card.visual === "proof" ? <ProofVisual /> : null}
        </div>

        <div className="mt-10">
          <p className="text-4xl font-light tracking-tight text-white">
            {card.number} — {card.title}
          </p>

          <div className="mt-8 h-px w-14 bg-white/15 transition duration-300 group-hover:w-24 group-hover:bg-violet-300/40" />

          <p className="mt-8 text-base leading-8 text-white/46">{card.text}</p>
        </div>
      </div>
    </motion.div>
  );
}

function GoalVisual() {
  return (
    <div className="w-full max-w-[260px] rounded-[26px] border border-white/10 bg-black/28 p-4 transition duration-300 group-hover:border-violet-400/20 group-hover:bg-black/34">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
        Goal setup
      </p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
        <p className="text-xs text-white/35">Target</p>
        <p className="mt-1 text-sm font-black text-white">Backend Developer</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <p className="text-xs text-white/35">Stack</p>
          <p className="mt-1 text-sm font-black text-white">Python</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <p className="text-xs text-white/35">Level</p>
          <p className="mt-1 text-sm font-black text-white">Beginner</p>
        </div>
      </div>

      <motion.div
        className="mt-4 h-2 rounded-full bg-violet-500"
        initial={{ width: "20%" }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

function TasksVisual() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const tasks = [
    {
      type: "Learn",
      title: "JWT basics",
      message: "Understand the concept before writing code.",
    },
    {
      type: "Code",
      title: "Auth endpoint",
      message: "Turn the concept into a working backend endpoint.",
    },
    {
      type: "Build",
      title: "Protected route",
      message: "Apply it inside a realistic project feature.",
    },
  ];

  return (
    <div className="w-full max-w-[270px] space-y-3">
      {tasks.map((task, index) => {
        const active = selectedTask === task.type;

        return (
          <motion.button
            key={task.title}
            type="button"
            onClick={() => {
              setSelectedTask(active ? null : task.type);
              trackEvent("landing_preview_task_click", {
                type: task.type,
                title: task.title,
              });
            }}
            initial={{ opacity: 0, x: 14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className={[
              "w-full rounded-2xl border px-4 py-3 text-left transition",
              active
                ? "border-violet-400/45 bg-violet-500/14"
                : "border-white/10 bg-black/28 hover:border-violet-400/30 hover:bg-violet-500/10",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-200">
                  {task.type}
                </p>

                <p className="mt-1 text-sm font-black text-white">
                  {task.title}
                </p>
              </div>

              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border transition",
                  active
                    ? "border-violet-300/60 bg-violet-400/20"
                    : "border-violet-400/30 bg-violet-500/10",
                ].join(" ")}
              >
                <ArrowRight
                  className={[
                    "h-3.5 w-3.5 transition",
                    active
                      ? "translate-x-[1px] text-violet-100"
                      : "text-violet-300/70",
                  ].join(" ")}
                />
              </div>
            </div>
          </motion.button>
        );
      })}

      {selectedTask ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200">
            Want tasks like this?
          </p>

          <p className="mt-2 text-xs leading-5 text-white/55">
            CodeForge turns your goal into daily learning, coding, and build tasks.
          </p>

          <Link
            href="/signup"
            onClick={() =>
              trackEvent("landing_task_inline_signup_click", {
                selected_task: selectedTask,
              })
            }
            className="mt-3 inline-flex items-center text-xs font-black text-violet-200 transition hover:text-white"
          >
            Generate My Roadmap
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </motion.div>
      ) : null}
    </div>
  );
}             

function ProofVisual() {
  return (
    <div className="w-full max-w-[270px] rounded-[26px] border border-emerald-300/20 bg-emerald-300/10 p-4 shadow-[0_0_30px_rgba(110,231,183,0.08)] transition duration-300 group-hover:shadow-[0_0_42px_rgba(110,231,183,0.10)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-200" />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            Verified
          </p>
          <p className="mt-1 text-sm font-black text-white">Progress counted</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-2 w-full rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-emerald-300"
            initial={{ width: "0%" }}
            whileInView={{ width: "82%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <p className="text-xs text-white/45">
          Code, explanation, and reasoning accepted.
        </p>
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/24 p-4 transition hover:border-violet-400/20 hover:bg-white/[0.035]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/36">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function PrimaryLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-violet-400/40 bg-violet-500/16 px-6 py-4 text-sm font-black text-violet-200 shadow-[0_0_32px_rgba(139,92,246,0.16)] transition duration-300 hover:-translate-y-[2px] hover:bg-violet-500/24"
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -left-20 top-0 h-full w-16 rotate-12 bg-white/16 blur-lg transition duration-700 group-hover:left-[140%]" />
      </div>

      <span className="relative z-10 inline-flex items-center">
        {children}
      </span>
    </Link>
  );
}