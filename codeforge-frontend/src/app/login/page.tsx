"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { saveAccessToken } from "@/lib/auth";

import BootScreen from "@/components/system/boot-screen";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [booting, setBooting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorText("");

    try {
      const response = await api.post("/auth/login/json", {
        email,
        password,
      });

      saveAccessToken(response.data.access_token);

      setBooting(true);
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        "Login failed. Please try again.";

      setErrorText(String(detail));

      setLoading(false);
    }
  }

  return (
    <>
      {booting ? (
        <BootScreen onComplete={() => router.replace("/dashboard")} />
      ) : null}

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--cf-bg)] px-6 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_30%)]" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(124,92,255,0.10),transparent_26%)]" />

        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 rounded-[36px] bg-[var(--cf-primary)]/5 blur-3xl" />

          <div className="relative rounded-[36px] border border-[var(--cf-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="relative mb-6 flex h-40 w-40 items-center justify-center rounded-[30px] border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 shadow-[0_0_40px_var(--cf-glow)]">
                <Image
                  src="/logo.svg"
                  alt="CodeForge"
                  width={110}
                  height={110}
                  priority
                  className="relative z-10"
                />
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[var(--cf-text)]">
                Log in
              </h1>

              <p className="mt-3 max-w-[290px] text-sm leading-6 text-[var(--cf-text-secondary)]">
                Continue execution. Progress waits for no one.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--cf-text-secondary)]">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[var(--cf-text)] outline-none transition duration-200 placeholder:text-[var(--cf-text)]/25 focus:border-violet-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--cf-text-secondary)]">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[var(--cf-text)] outline-none transition duration-200 placeholder:text-[var(--cf-text)]/25 focus:border-violet-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
                />
              </div>

              {errorText ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorText}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:border-violet-400/40 hover:bg-violet-500/15 hover:shadow-[0_0_35px_rgba(139,92,246,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02))]" />

                <div className="absolute -left-10 top-0 h-full w-12 rotate-12 bg-white/10 blur-xl transition-all duration-700 group-hover:left-[120%]" />

                <span className="relative z-10">
                  {loading ? "Authenticating..." : "Log in"}
                </span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[var(--cf-text-secondary)]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-[var(--cf-accent)] transition hover:opacity-80"
                >
                  Sign up
                </Link>
              </p>

              <p className="mt-6 text-center text-sm text-white/45">
                By continuing you agree to our{" "}

                <Link
                  href="/legal/terms"
                  className="text-[#8b5cf6] hover:text-white"
                >
                  Terms
                </Link>

                ,{" "}

                <Link
                  href="/legal/privacy"
                  className="text-[#8b5cf6] hover:text-white"
                >
                  Privacy Policy
                </Link>

                {" "}and{" "}

                <Link
                  href="/legal/refund"
                  className="text-[#8b5cf6] hover:text-white"
                >
                  Refund Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}