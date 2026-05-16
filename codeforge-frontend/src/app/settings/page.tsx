"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Brain,
  CreditCard,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  Palette,
  Shield,
  SlidersHorizontal,
  User,
} from "lucide-react";

import LiquidGlassButton from "@/components/ui/liquid-glass-button";
import LogoutButton from "@/components/ui/logout-button";
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
  avatar_url?: string | null;
  bio?: string | null;
  role?: string;
  subscription_tier?: string;
  theme: ThemeMode;
  pressure_level: PressureLevel;
  ai_strictness: AiStrictness;
  daily_reminder_enabled: boolean;
  streak_warning_enabled: boolean;
  inactivity_alert_enabled: boolean;
  timezone?: string;
  daily_reminder_hour?: number;
  streak_warning_hour?: number;
};

type SettingsPayload = Partial<{
  theme: ThemeMode;
  pressure_level: PressureLevel;
  ai_strictness: AiStrictness;
  daily_reminder_enabled: boolean;
  streak_warning_enabled: boolean;
  inactivity_alert_enabled: boolean;
  timezone: string;
  daily_reminder_hour: number;
  streak_warning_hour: number;
}>;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<MeUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingKey, setSavingKey] = useState("");

  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileForm, setProfileForm] = useState({
    username: "",
    bio: "",
    avatar_url: "",
  });

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
        setProfileForm({
          username: data.username || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
        });
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
  const plan = (user?.subscription_tier || "free").toUpperCase();

  return (
    <div className="space-y-6 pb-6 md:space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--cf-accent)] md:text-sm">
          Control Panel
        </p>

        <h1 className="text-4xl font-black tracking-tight text-[var(--cf-text)] md:text-5xl">
          Settings
        </h1>

        <p className="max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Configure profile, security, execution pressure, notifications and
          legal access.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card
          icon={<User className="h-5 w-5" />}
          title="Profile"
          subtitle="Current authenticated operator."
        >
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 text-lg font-black text-[var(--cf-accent)] shadow-[0_0_22px_var(--cf-glow)]">
                {user?.username?.slice(0, 2).toUpperCase() || "CF"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xl font-black text-[var(--cf-text)]">
                  {loadingUser ? "Loading..." : user?.username || "CodeForge user"}
                </p>
                <p className="mt-1 truncate text-sm text-[var(--cf-text-secondary)]">
                  {user?.email || "No email loaded"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <InfoPill label="Role" value={user?.role || "user"} />
              <InfoPill label="Plan" value={plan} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="w-full rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-4 py-3 text-sm font-black text-[var(--cf-accent)] transition hover:bg-[var(--cf-primary)]/16"
              >
                Edit profile
              </button>
            </div>
          </div>
        </Card>

        <Card
          icon={<Palette className="h-5 w-5" />}
          title="Appearance"
          subtitle="Choose how the system looks."
        >
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

        <Card
          icon={<CreditCard className="h-5 w-5" />}
          title="Subscription"
          subtitle="Execution depth depends on plan."
        >
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
            <p className="text-sm text-[var(--cf-text-muted)]">Current plan</p>

            <p className="mt-1 text-4xl font-black text-[var(--cf-text)]">
              {plan}
            </p>

            <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
              Higher plans unlock deeper AI analysis, adaptive tasks, more daily
              execution and stronger review depth.
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

        <Card
          icon={<Lock className="h-5 w-5" />}
          title="Security"
          subtitle="Protect access. Remove weak points."
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
              <p className="font-bold text-[var(--cf-text)]">Password reset</p>
              <p className="mt-1 text-sm leading-6 text-[var(--cf-text-secondary)]">
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

            <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
              <p className="font-bold text-[var(--cf-text)]">Session</p>
              <p className="mt-1 text-sm leading-6 text-[var(--cf-text-secondary)]">
                Close this device session safely.
              </p>

              <div className="mt-4">
                <LogoutButton />
              </div>
            </div>
          </div>
        </Card>

        <Card
          icon={<SlidersHorizontal className="h-5 w-5" />}
          title="Execution Control"
          subtitle="Set how hard the system pushes you."
        >
          <div className="space-y-6">
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
                    updateSettings({ pressure_level: "soft" }, "pressure-soft")
                  }
                />

                <ChoiceButton
                  active={pressure === "normal"}
                  title="Normal"
                  subtitle="Balanced"
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
                    updateSettings({ pressure_level: "hard" }, "pressure-hard")
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
                  subtitle="Forgiving"
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
                  subtitle="High bar"
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

        <Card
          icon={<Bell className="h-5 w-5" />}
          title="Notifications"
          subtitle="Retention pressure system."
        >
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

        <Card
          icon={<Brain className="h-5 w-5" />}
          title="Time & reminders"
          subtitle="Control when the system nudges you."
        >
          <div className="grid gap-3">
            <SelectRow
              label="Timezone"
              value={user?.timezone || "Asia/Almaty"}
              disabled={savingKey === "timezone"}
              onChange={(value) =>
                updateSettings({ timezone: value }, "timezone")
              }
              options={[
                "Asia/Almaty",
                "Asia/Astana",
                "Europe/London",
                "Europe/Berlin",
                "America/New_York",
              ]}
            />

            <HourRow
              label="Daily reminder hour"
              value={user?.daily_reminder_hour ?? 12}
              disabled={savingKey === "daily-hour"}
              onChange={(value) =>
                updateSettings({ daily_reminder_hour: value }, "daily-hour")
              }
            />

            <HourRow
              label="Streak warning hour"
              value={user?.streak_warning_hour ?? 20}
              disabled={savingKey === "streak-hour"}
              onChange={(value) =>
                updateSettings({ streak_warning_hour: value }, "streak-hour")
              }
            />
          </div>
        </Card>

        <Card
          icon={<Shield className="h-5 w-5" />}
          title="Legal"
          subtitle="Review CodeForge policies and support."
        >
          <div className="grid gap-3">
            <LegalLink href="/legal/terms" title="Terms of Service" />
            <LegalLink href="/legal/privacy" title="Privacy Policy" />
            <LegalLink href="/legal/refund" title="Refund Policy" />

            <a
              href="mailto:codeforgesupport@codeforgeapp.com"
              className="flex items-center justify-between rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-4 text-sm font-bold text-[var(--cf-text)] transition hover:border-[var(--cf-primary)]/40 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)]"
            >
              <span className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                Contact support
              </span>

              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </Card>

        <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
          <h2 className="text-2xl font-black text-[var(--cf-text)]">
            Tutorial
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
            Replay the guided onboarding tour and walkthrough again.
          </p>

          <button
            onClick={() => {
              localStorage.removeItem("codeforge_guided_tour_completed");
              window.location.href = "/dashboard";
            }}
            className="
              mt-6 rounded-2xl border border-[var(--cf-primary)]/30
              bg-[var(--cf-primary)]/12
              px-5 py-3 text-sm font-black
              text-[var(--cf-accent)]
              transition-all duration-200
              hover:bg-[var(--cf-primary)]/18
              hover:shadow-[0_0_24px_var(--cf-glow)]
            "
          >
            Replay tutorial
          </button>
        </section>

      </section>

      {profileOpen ? (
        <EditProfileModal
          form={profileForm}
          error={profileError}
          saving={profileSaving}
          onClose={() => setProfileOpen(false)}
          onChange={setProfileForm}
          onSave={async () => {
            setProfileSaving(true);
            setProfileError("");

            try {
              const response = await api.patch("/auth/me/profile", {
                username: profileForm.username.trim(),
                bio: profileForm.bio.trim() || null,
                avatar_url: profileForm.avatar_url.trim() || null,
              });

              setUser(response.data);
              setProfileOpen(false);
            } catch (error: any) {
              setProfileError(
                error?.response?.data?.detail ||
                  error?.message ||
                  "Could not update profile."
              );
            } finally {
              setProfileSaving(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function Card({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.14)] md:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)] shadow-[0_0_20px_var(--cf-glow)]">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-black text-[var(--cf-text)]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--cf-text-secondary)]">
            {subtitle}
          </p>
        </div>
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
        "group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 disabled:cursor-wait disabled:opacity-70 md:p-4",
        "before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))] before:opacity-0 before:transition-opacity before:duration-300",
        "after:absolute after:-left-1/3 after:top-0 after:h-full after:w-1/2 after:rotate-12 after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] after:opacity-0 after:transition-all after:duration-500",
        "hover:after:left-[120%] hover:after:opacity-100 hover:before:opacity-100",
        active
          ? "border-[var(--cf-primary)] bg-[var(--cf-primary)]/15 shadow-[0_0_24px_var(--cf-glow)]"
          : "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] hover:border-[var(--cf-primary)]/45 hover:bg-[var(--cf-primary)]/10 hover:shadow-[0_12px_32px_var(--cf-glow)]",
      ].join(" ")}
    >
      <p className="relative z-10 text-sm font-black text-[var(--cf-text)] md:text-base">
        {loading ? "Saving..." : title}
      </p>

      <p className="relative z-10 mt-1 text-xs leading-5 text-[var(--cf-text-muted)]">
        {subtitle}
      </p>
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
      <p className="mt-1 text-sm leading-6 text-[var(--cf-text-secondary)]">
        {text}
      </p>
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
        <p className="mt-1 text-sm leading-6 text-[var(--cf-text-secondary)]">
          {text}
        </p>
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

function LegalLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-4 text-sm font-bold text-[var(--cf-text)] transition hover:border-[var(--cf-primary)]/40 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)]"
    >
      <span className="flex items-center gap-3">
        <FileText className="h-4 w-4" />
        {title}
      </span>

      <ExternalLink className="h-4 w-4" />
    </Link>
  );
}

function SelectRow({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
      <p className="text-sm font-bold text-[var(--cf-text)]">{label}</p>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-xl border border-[var(--cf-border)] bg-[var(--cf-card)] px-3 py-3 text-sm font-bold text-[var(--cf-text)] outline-none transition focus:border-[var(--cf-primary)]/50 disabled:cursor-wait disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function HourRow({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[var(--cf-text)]">{label}</p>
        <p className="text-sm font-black text-[var(--cf-accent)]">
          {String(value).padStart(2, "0")}:00
        </p>
      </div>

      <input
        type="range"
        min={0}
        max={23}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-violet-500 disabled:cursor-wait disabled:opacity-60"
      />
    </label>
  );
}
function EditProfileModal({
  form,
  error,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  form: {
    username: string;
    bio: string;
    avatar_url: string;
  };
  error: string;
  saving: boolean;
  onClose: () => void;
  onChange: (value: {
    username: string;
    bio: string;
    avatar_url: string;
  }) => void;
  onSave: () => void;
}) {
  const avatarPreview = form.avatar_url.trim();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close edit profile"
      />

      <div className="relative w-full max-w-lg rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_0_70px_rgba(0,0,0,0.55)]">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-accent)]">
            Profile
          </p>

          <h2 className="mt-2 text-3xl font-black text-[var(--cf-text)]">
            Edit profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--cf-text-secondary)]">
            Update how your CodeForge profile appears inside the system.
          </p>
        </div>

        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 text-xl font-black text-[var(--cf-accent)]">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              form.username.slice(0, 2).toUpperCase() || "CF"
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-black text-[var(--cf-text)]">
              {form.username || "CodeForge user"}
            </p>
            <p className="mt-1 text-sm text-[var(--cf-text-muted)]">
              Avatar preview
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <p className="text-sm font-bold text-[var(--cf-text)]">Username</p>
            <input
              value={form.username}
              onChange={(event) =>
                onChange({ ...form, username: event.target.value })
              }
              className="mt-2 w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--cf-text)] outline-none transition focus:border-[var(--cf-primary)]/50"
              placeholder="Your username"
            />
          </label>

          <label className="block">
            <p className="text-sm font-bold text-[var(--cf-text)]">Bio</p>
            <textarea
              value={form.bio}
              onChange={(event) =>
                onChange({ ...form, bio: event.target.value })
              }
              rows={4}
              maxLength={300}
              className="mt-2 w-full resize-none rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--cf-text)] outline-none transition focus:border-[var(--cf-primary)]/50"
              placeholder="Short profile description..."
            />
            <p className="mt-1 text-xs text-[var(--cf-text-muted)]">
              {form.bio.length}/300
            </p>
          </label>

          <label className="block">
            <p className="text-sm font-bold text-[var(--cf-text)]">
              Avatar URL
            </p>
            <input
              value={form.avatar_url}
              onChange={(event) =>
                onChange({ ...form, avatar_url: event.target.value })
              }
              className="mt-2 w-full rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--cf-text)] outline-none transition focus:border-[var(--cf-primary)]/50"
              placeholder="https://example.com/avatar.png"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/30 hover:text-[var(--cf-text)] disabled:cursor-wait disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || form.username.trim().length < 3}
            className="flex-1 rounded-2xl border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/15 px-4 py-3 text-sm font-black text-[var(--cf-accent)] transition hover:bg-[var(--cf-primary)]/22 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}