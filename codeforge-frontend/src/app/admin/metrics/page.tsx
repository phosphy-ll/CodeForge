"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Flame,
  Loader2,
  Target,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";

type AnalyticsMetric = {
  total: number;
  last_24h: number;
  last_7d: number;
};

type AdminMetrics = {
  users: {
    total: number;
    verified: number;
    last_24h: number;
    last_7d: number;
    paid: number;
    beta_testers: number;
  };
  goals: {
    total: number;
    active: number;
    last_24h: number;
    last_7d: number;
  };
  daily_plans: {
    total: number;
    last_24h: number;
    last_7d: number;
  };
  submissions: {
    total: number;
    verified: number;
    last_24h: number;
    last_7d: number;
  };
  analytics: Record<string, AnalyticsMetric>;
};

export default function AdminMetricsPage() {
  const router = useRouter();

  const [data, setData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  async function loadMetrics() {
    try {
      setLoading(true);
      setErrorText("");

      const response = await api.get("/admin/metrics");
      setData(response.data);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setErrorText("Admin access required.");
        return;
      }

      if (error?.response?.status === 401) {
        router.push("/login");
        return;
      }

      setErrorText(
        error?.response?.data?.detail || "Failed to load admin metrics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  const funnelRows = useMemo(() => {
    if (!data) return [];

    return Object.entries(data.analytics).map(([name, metric]) => ({
      name,
      ...metric,
    }));
  }, [data]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--cf-text-secondary)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-bold">Loading admin metrics...</span>
        </div>
      </main>
    );
  }

  if (errorText || !data) {
    return (
      <main className="space-y-6">
        <Header onReload={loadMetrics} />

        <section className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">
          {errorText || "No metrics data."}
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <Header onReload={loadMetrics} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          title="Users"
          value={data.users.total}
          sub={`${data.users.verified} verified • ${data.users.last_24h} today`}
        />

        <MetricCard
          icon={<Target className="h-5 w-5" />}
          title="Goals"
          value={data.goals.total}
          sub={`${data.goals.active} active • ${data.goals.last_24h} today`}
        />

        <MetricCard
          icon={<Flame className="h-5 w-5" />}
          title="Daily plans"
          value={data.daily_plans.total}
          sub={`${data.daily_plans.last_24h} today • ${data.daily_plans.last_7d} week`}
        />

        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Submissions"
          value={data.submissions.total}
          sub={`${data.submissions.verified} verified • ${data.submissions.last_24h} today`}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <MiniPanel title="Revenue signals">
          <Row label="Paid users" value={data.users.paid} />
          <Row label="Beta testers" value={data.users.beta_testers} />
        </MiniPanel>

        <MiniPanel title="User growth">
          <Row label="Users last 24h" value={data.users.last_24h} />
          <Row label="Users last 7d" value={data.users.last_7d} />
          <Row label="Verified users" value={data.users.verified} />
        </MiniPanel>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-3 border-b border-[var(--cf-border)] px-6 py-5">
          <BarChart3 className="h-5 w-5 text-[var(--cf-accent)]" />
          <div>
            <h2 className="text-xl font-black text-[var(--cf-text)]">
              Conversion events
            </h2>
            <p className="text-sm text-[var(--cf-text-secondary)]">
              Landing → signup → verify → today funnel.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-xs uppercase tracking-[0.16em] text-[var(--cf-text-muted)]">
              <tr>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">24h</th>
                <th className="px-6 py-4">7d</th>
              </tr>
            </thead>

            <tbody>
              {funnelRows.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-[var(--cf-border)] last:border-b-0"
                >
                  <td className="px-6 py-4 text-sm font-black text-[var(--cf-text)]">
                    {formatEventName(row.name)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--cf-text-secondary)]">
                    {row.total}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--cf-text-secondary)]">
                    {row.last_24h}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--cf-text-secondary)]">
                    {row.last_7d}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Header({ onReload }: { onReload: () => void }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--cf-accent)]">
          Admin
        </p>

        <h1 className="mt-2 text-4xl font-black text-[var(--cf-text)]">
          Metrics
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)]">
          Product health, conversion events, and early beta activity.
        </p>
      </div>

      <button
        onClick={onReload}
        className="inline-flex items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-5 py-3 text-sm font-black text-[var(--cf-accent)] transition hover:bg-[var(--cf-primary)]/18"
      >
        <Activity className="mr-2 h-4 w-4" />
        Reload
      </button>
    </header>
  );
}

function MetricCard({
  icon,
  title,
  value,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  sub: string;
}) {
  return (
    <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 text-[var(--cf-accent)]">
        {icon}
      </div>

      <p className="mt-5 text-sm font-bold text-[var(--cf-text-secondary)]">
        {title}
      </p>

      <p className="mt-2 text-4xl font-black text-[var(--cf-text)]">
        {value}
      </p>

      <p className="mt-2 text-sm text-[var(--cf-text-muted)]">{sub}</p>
    </section>
  );
}

function MiniPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6">
      <h2 className="text-xl font-black text-[var(--cf-text)]">{title}</h2>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3">
      <span className="text-sm text-[var(--cf-text-secondary)]">{label}</span>
      <span className="text-sm font-black text-[var(--cf-text)]">{value}</span>
    </div>
  );
}

function formatEventName(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}