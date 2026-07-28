"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");


  useEffect(() => {
    trackEvent("email_verify_opened");
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorText("");
    setSuccessText("");

    trackEvent("email_verify_submit");

    try {
      await api.post("/auth/verify-email-code", {
        email,
        code,
      });

      setSuccessText("Email verified. Redirecting to login...");

      trackEvent("email_verified");

      window.setTimeout(() => {
        router.replace("/login?verified=1");
      }, 900);
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        "Verification failed.";
        trackEvent("email_verify_failed", {
          reason: String(detail),
        });

      setErrorText(String(detail));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;

    setResending(true);
    setErrorText("");
    setSuccessText("");

    try {
      await api.post("/auth/resend-verification-code", {
        email,
      });

      setSuccessText("New verification code sent.");
      trackEvent("email_verify_code_resent");
      setCooldown(45);
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to resend code.";
        trackEvent("email_verify_resend_failed", {
          reason: String(detail),
        });

      setErrorText(String(detail));
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--cf-bg)] px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_30%)]" />

      <div className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015))]" />

        <div className="relative z-10">
          <div className="mb-8 text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
              CodeForge
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-tight">
              Verify your email
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Enter the 6-digit code we sent to your email. The code expires in 15 minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/65">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-violet-400/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white/65">
                Verification code
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                placeholder="123456"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-white outline-none placeholder:text-white/20 focus:border-violet-400/40"
              />
            </div>

            {errorText ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorText}
              </div>
            ) : null}

            {successText ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {successText}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-2xl border border-white/15 bg-violet-600/80 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify email"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email}
              className="text-sm font-bold text-violet-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend verification code"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}