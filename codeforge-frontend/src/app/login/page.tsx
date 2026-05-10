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

          <div className="relative rounded-[36px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
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
                  className="w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3.5 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] focus:border-[var(--cf-primary)]/50"
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
                  className="w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3.5 text-[var(--cf-text)] outline-none transition placeholder:text-[var(--cf-text-muted)] focus:border-[var(--cf-primary)]/50"
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
                className="w-full rounded-2xl border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)] px-4 py-3.5 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Authenticating..." : "Log in"}
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}