"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  useEffect(() => {
    trackEvent("signup_opened");
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorText("");

    trackEvent("signup_submit");

    try {
      await api.post("/auth/register", {
        email,
        username,
        password,
      });

      trackEvent("signup_success");

      router.push(
        `/verify-email?email=${encodeURIComponent(email)}`
      );
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        "Registration failed. Please try again.";

        trackEvent("signup_failed", {
          reason: String(detail),
        });

      setErrorText(String(detail));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--cf-bg)] px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_30%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.10),transparent_26%)]" />

      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 rounded-[36px] bg-violet-500/5 blur-3xl" />

        <div className="relative rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative mb-6 flex h-45 w-45 items-center justify-center rounded-[30px] border border-violet-400/20 bg-violet-500/10 shadow-[0_0_40px_rgba(139,92,246,0.14)]">
              <div className="absolute inset-0 rounded-[30px] bg-violet-500/10 blur-2xl" />

              <Image
                src="/logo.svg"
                alt="CodeForge"
                width={130}
                height={130}
                priority
                className="relative z-10 drop-shadow-[0_0_16px_rgba(139,92,246,0.38)]"
              />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--cf-text)]">
              Sign up
            </h1>

            <p className="mt-3 max-w-[290px] text-sm leading-6 text-[var(--cf-text)]/55">
              Create your CodeForge account and start building verified progress.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--cf-text)]/70">
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
              <label className="mb-2 block text-sm font-medium text-[var(--cf-text)]/70">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Your username"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[var(--cf-text)] outline-none transition duration-200 placeholder:text-[var(--cf-text)]/25 focus:border-violet-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--cf-text)]/70">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pr-12 text-[var(--cf-text)] outline-none transition duration-200 placeholder:text-[var(--cf-text)]/25 focus:border-violet-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/65">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                className="mt-1"
              />

              <span>
                I agree to the{" "}
                <Link
                  href="/legal/terms"
                  className="text-[#8b5cf6] hover:text-white"
                >
                  Terms of Service
                </Link>
                ,{" "}
                <Link
                  href="/legal/privacy"
                  className="text-[#8b5cf6] hover:text-white"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal/refund"
                  className="text-[#8b5cf6] hover:text-white"
                >
                  Refund Policy
                </Link>
              </span>
            </label>

            {errorText ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorText}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !acceptedPolicies}
              className="group relative w-full overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:border-violet-400/40 hover:bg-violet-500/15 hover:shadow-[0_0_35px_rgba(139,92,246,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02))]" />

              <div className="absolute -left-10 top-0 h-full w-12 rotate-12 bg-white/10 blur-xl transition-all duration-700 group-hover:left-[120%]" />

              <span className="relative z-10">
                {loading ? "Creating account..." : "Create account"}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--cf-text)]/55">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-violet-300 transition hover:text-violet-200"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}