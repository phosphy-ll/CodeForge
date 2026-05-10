"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";
import { api } from "@/lib/api";
import { getMe } from "@/lib/user";
import { useTheme } from "@/components/theme/theme-provider";

type PressureLevel = "soft" | "normal" | "hard";
type AiStrictness = "lenient" | "balanced" | "strict";
type ThemeMode = "dark" | "light";

type MeUser = {
  id: number;
  email: string;
  username: string;
  role?: string;
  subscription_tier?: string;
  theme: ThemeMode;
  pressure_level: PressureLevel;
  ai_strictness: AiStrictness;
  daily_reminder_enabled: boolean;
  streak_warning_enabled: boolean;
  inactivity_alert_enabled: boolean;
};

type SettingsPayload = Partial<{
  theme: ThemeMode;
  pressure_level: PressureLevel;
  ai_strictness: AiStrictness;
  daily_reminder_enabled: boolean;
  streak_warning_enabled: boolean;
  inactivity_alert_enabled: boolean;
}>;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<MeUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingKey, setSavingKey] = useState<string>("");

  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const data: MeUser | null = await getMe();

        if (!data) {
          setUser(null);
          return;
        }

        setUser(data);

        if (data.theme === "dark" || data.theme === "light") {
          setTheme(data.theme);
        }
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, [setTheme]);

  async function updateSettings(payload: SettingsPayload, key: string) {
    if (!user) return;

    setSavingKey(key);

    const previousUser = user;
    const optimisticUser = { ...user, ...payload };

    setUser(optimisticUser);

    if (payload.theme) {
      setTheme(payload.theme);
    }

    try {
      const response = await api.patch("/auth/me/settings", payload);
      setUser(response.data);
    } catch {
      setUser(previousUser);

      if (previousUser.theme) {
        setTheme(previousUser.theme);
      }
    } finally {
      setSavingKey("");
    }
  }

  async function sendResetPassword() {
    if (!user?.email) return;

    setResetLoading(true);
    setResetMessage("");
    setResetError("");

    try {
      await api.post("/auth/forgot-password", {
        email: user.email,
      });

      setResetMessage("Reset link sent. Check your email.");
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        "Could not send reset link.";

      setResetError(String(detail));
    } finally {
      setResetLoading(false);
    }
  }

  const currentTheme = user?.theme || theme;
  const pressure = user?.pressure_level || "normal";
  const strictness = user?.ai_strictness || "balanced";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cf-accent)]">
          Control Panel
        </p>
        <h1 className="text-4xl font-black tracking-tight text-[var(--cf-text)]">
          Settings
        </h1>
        <p className="max-w-2xl text-sm text-[var(--cf-text-secondary)]">
          Configure the system. No comfort settings. Only execution control.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card title="Appearance" subtitle="Choose how the system looks.">
          <div className="grid grid-cols-2 gap-3">
            <ChoiceButton
              active={currentTheme === "dark"}
              title="Dark"
              subtitle="Default execution mode"
              loading={savingKey === "theme-dark"}
              onClick={() => updateSettings({ theme: "dark" }, "theme-dark")}
            />
            <ChoiceButton
              active={currentTheme === "light"}
              title="Light"
              subtitle="Clean focus mode"
              loading={savingKey === "theme-light"}
              onClick={() => updateSettings({ theme: "light" }, "theme-light")}
            />
          </div>
        </Card>

        <Card title="Account" subtitle="Current authenticated operator.">
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
            <p className="text-lg font-bold text-[var(--cf-text)]">
              {loadingUser ? "Loading..." : user?.username || "CodeForge user"}
            </p>
            <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">
              {user?.email || "No email loaded"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InfoPill label="Role" value={user?.role || "user"} />
              <InfoPill
                label="Plan"
                value={(user?.subscription_tier || "free").toUpperCase()}
              />
            </div>

            <button
              disabled
              className="mt-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-bg)] px-4 py-2 text-sm font-semibold text-[var(--cf-text-muted)] opacity-70"
            >
              Edit profile — later
            </button>
          </div>
        </Card>

        <Card title="Subscription" subtitle="Execution depth depends on plan.">
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
            <p className="text-sm text-[var(--cf-text-muted)]">Current plan</p>
            <p className="mt-1 text-3xl font-black text-[var(--cf-text)]">
              {(user?.subscription_tier || "free").toUpperCase()}
            </p>
            <p className="mt-2 text-sm text-[var(--cf-text-secondary)]">
              Higher plans unlock deeper AI analysis, adaptive tasks and stronger
              execution pressure.
            </p>

            {user?.subscription_tier?.toLowerCase() !== "ultra" ? (
              <Link href="/subscription" className="mt-5 inline-block">
                <LiquidGlassButton>Upgrade execution</LiquidGlassButton>
              </Link>
            ) : (
              <div className="mt-5 rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-4 py-3 text-sm font-bold text-[var(--cf-accent)]">
                Maximum execution tier active
              </div>
            )}
          </div>
        </Card>

        <Card title="Security" subtitle="Protect access. Remove weak points.">
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
            <p className="font-bold text-[var(--cf-text)]">Password reset</p>
            <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">
              Send a reset link to your current email.
            </p>

            <div className="mt-4">
              <LiquidGlassButton
                onClick={sendResetPassword}
                disabled={resetLoading || !user?.email}
              >
                {resetLoading ? "Sending..." : "Send reset link"}
              </LiquidGlassButton>
            </div>

            {resetMessage ? (
              <p className="mt-3 text-sm text-emerald-400">{resetMessage}</p>
            ) : null}

            {resetError ? (
              <p className="mt-3 text-sm text-red-400">{resetError}</p>
            ) : null}
          </div>
        </Card>

        <Card
          title="Execution Control"
          subtitle="Set how hard the system pushes you."
        >
          <div className="space-y-5">
            <div>
              <SettingLabel
                title="Pressure level"
                text="Controls how direct and demanding the system feels."
              />
              <div className="mt-3 grid grid-cols-3 gap-3">
                <ChoiceButton
                  active={pressure === "soft"}
                  title="Soft"
                  subtitle="Less pressure"
                  loading={savingKey === "pressure-soft"}
                  onClick={() =>
                    updateSettings(
                      { pressure_level: "soft" },
                      "pressure-soft"
                    )
                  }
                />
                <ChoiceButton
                  active={pressure === "normal"}
                  title="Normal"
                  subtitle="Balanced push"
                  loading={savingKey === "pressure-normal"}
                  onClick={() =>
                    updateSettings(
                      { pressure_level: "normal" },
                      "pressure-normal"
                    )
                  }
                />
                <ChoiceButton
                  active={pressure === "hard"}
                  title="Hard"
                  subtitle="No excuses"
                  loading={savingKey === "pressure-hard"}
                  onClick={() =>
                    updateSettings(
                      { pressure_level: "hard" },
                      "pressure-hard"
                    )
                  }
                />
              </div>
            </div>

            <div>
              <SettingLabel
                title="AI strictness"
                text="Controls how strict verification feedback should feel."
              />
              <div className="mt-3 grid grid-cols-3 gap-3">
                <ChoiceButton
                  active={strictness === "lenient"}
                  title="Lenient"
                  subtitle="More forgiving"
                  loading={savingKey === "strictness-lenient"}
                  onClick={() =>
                    updateSettings(
                      { ai_strictness: "lenient" },
                      "strictness-lenient"
                    )
                  }
                />
                <ChoiceButton
                  active={strictness === "balanced"}
                  title="Balanced"
                  subtitle="Default"
                  loading={savingKey === "strictness-balanced"}
                  onClick={() =>
                    updateSettings(
                      { ai_strictness: "balanced" },
                      "strictness-balanced"
                    )
                  }
                />
                <ChoiceButton
                  active={strictness === "strict"}
                  title="Strict"
                  subtitle="High standard"
                  loading={savingKey === "strictness-strict"}
                  onClick={() =>
                    updateSettings(
                      { ai_strictness: "strict" },
                      "strictness-strict"
                    )
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Notifications" subtitle="Retention pressure system.">
          <div className="space-y-3">
            <ToggleRow
              title="Daily reminder"
              text="Remind me to execute today’s plan."
              enabled={user?.daily_reminder_enabled ?? true}
              loading={savingKey === "daily-reminder"}
              onChange={(value) =>
                updateSettings(
                  { daily_reminder_enabled: value },
                  "daily-reminder"
                )
              }
            />
            <ToggleRow
              title="Streak warning"
              text="Warn me before the streak is at risk."
              enabled={user?.streak_warning_enabled ?? true}
              loading={savingKey === "streak-warning"}
              onChange={(value) =>
                updateSettings(
                  { streak_warning_enabled: value },
                  "streak-warning"
                )
              }
            />
            <ToggleRow
              title="Inactivity alert"
              text="Push harder if I stop moving."
              enabled={user?.inactivity_alert_enabled ?? false}
              loading={savingKey === "inactivity-alert"}
              onChange={(value) =>
                updateSettings(
                  { inactivity_alert_enabled: value },
                  "inactivity-alert"
                )
              }
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.14)]">
      <div className="mb-5">
        <h2 className="text-xl font-black text-[var(--cf-text)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">
          {subtitle}
        </p>
      </div>

      {children}
    </div>
  );
}

function ChoiceButton({
  active,
  title,
  subtitle,
  loading,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={[
        "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 disabled:cursor-wait disabled:opacity-70",

        // 🔥 liquid glass layers
        "before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))] before:opacity-0 before:transition-opacity before:duration-300",
        "after:absolute after:-left-1/3 after:top-0 after:h-full after:w-1/2 after:rotate-12 after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] after:opacity-0 after:transition-all after:duration-500",

        // hover animation
        "hover:after:left-[120%] hover:after:opacity-100 hover:before:opacity-100",

        active
          ? "border-[var(--cf-primary)] bg-[var(--cf-primary)]/15 shadow-[0_0_24px_var(--cf-glow)]"
          : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] hover:border-[var(--cf-primary)]/45 hover:bg-[var(--cf-primary)]/10 hover:shadow-[0_12px_32px_var(--cf-glow)]",
      ].join(" ")}
    >
      <p className="relative z-10 font-black text-[var(--cf-text)]">
        {loading ? "Saving..." : title}
      </p>
      <p className="relative z-10 mt-1 text-xs text-[var(--cf-text-muted)]">{subtitle}</p>
    </button>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-card)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--cf-text-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-[var(--cf-text)]">
        {value}
      </p>
    </div>
  );
}

function SettingLabel({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="font-bold text-[var(--cf-text)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">{text}</p>
    </div>
  );
}

function ToggleRow({
  title,
  text,
  enabled,
  loading,
  onChange,
}: {
  title: string;
  text: string;
  enabled: boolean;
  loading?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      disabled={loading}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4 text-left transition hover:border-[var(--cf-primary)]/40 disabled:cursor-wait disabled:opacity-70"
    >
      <div>
        <p className="font-bold text-[var(--cf-text)]">{title}</p>
        <p className="mt-1 text-sm text-[var(--cf-text-secondary)]">{text}</p>
      </div>

      <span
        className={[
          "relative h-7 w-12 shrink-0 rounded-full border transition",
          enabled
            ? "border-[var(--cf-primary)] bg-[var(--cf-primary)]/30"
            : "border-[var(--cf-border)] bg-[var(--cf-bg)]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full transition",
            enabled
              ? "left-6 bg-[var(--cf-primary)]"
              : "left-1 bg-[var(--cf-text-muted)]",
          ].join(" ")}
        />
      </span>
    </button>
  );
}