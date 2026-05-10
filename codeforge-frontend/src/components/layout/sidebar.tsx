"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/ui/logout-button";
import { getMe } from "@/lib/user";
import SidebarIcon from "@/components/layout/sidebar-icon";
import { useTheme } from "@/components/theme/theme-provider";

const navSections = [
  {
    label: "Core",
    items: [
      { name: "Dashboard", href: "/dashboard", iconSrc: "/icons/dashboard.svg" },
      { name: "Today", href: "/today", iconSrc: "/icons/toda.svg" },
      { name: "Roadmap", href: "/roadmap", iconSrc: "/icons/roadmap.svg" },
    ],
  },
  {
    label: "Training",
    items: [
      { name: "Practice", href: "/practice", iconSrc: "/icons/practice.svg" },
      { name: "AI Coach", href: "/ai-coach", iconSrc: "/icons/ai-coach.svg" },
      { name: "Exams", href: "/exams", iconSrc: "/icons/exam.svg" },
      { name: "Submissions", href: "/submissions", iconSrc: "/icons/tasks.svg" },
      { name: "Weakness Map", href: "/weakness-map", iconSrc: "/icons/weakness_map.svg" },
    ],
  },
  {
    label: "Progress",
    items: [
      { name: "Leaderboard", href: "/leaderboard", iconSrc: "/icons/leaderboard.svg" },
      { name: "Achievements", href: "/achievements", iconSrc: "/icons/achievements.svg" },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Subscription", href: "/subscription", iconSrc: "/icons/subscription.svg" },
      { name: "Settings", href: "/settings", iconSrc: "/icons/settings.svg" },
    ],
  },
] as const;

type MeUser = {
  id: number;
  email: string;
  username: string;
  role?: string;
  subscription_tier?: string;
};

export default function Sidebar() {
  const { theme } = useTheme();
  const pathname = usePathname();

  const [expanded, setExpanded] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        const data = await getMe();
        if (mounted) setUser(data);
      } catch {
        if (mounted) setUser(null);
      }
    }

    loadMe();

    return () => {
      mounted = false;
    };
  }, []);

  const subscriptionTier = (user?.subscription_tier || "free").toLowerCase();
  const isUltra = subscriptionTier === "ultra";

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={[
        "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-[var(--cf-border)] bg-[var(--cf-bg-secondary)]",
        "transition-all duration-300",
        expanded ? "w-72" : "w-20",
      ].join(" ")}
    >
      <div className="flex h-24 items-center border-b border-[var(--cf-border)] px-4">
        <div
          className={[
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 hover:scale-[1.04]",
            theme === "dark"
              ? "border-[var(--cf-border)] bg-[var(--cf-card)] shadow-[0_0_28px_var(--cf-glow)]"
              : "border-[var(--cf-primary)] bg-[var(--cf-primary)] shadow-[0_0_28px_var(--cf-glow)]",
          ].join(" ")}
        >
          <img
            src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
            alt="CodeForge"
            className="h-10 w-10 object-contain"
          />
        </div>

        <div
          className={[
            "ml-4 overflow-hidden transition-all duration-300",
            expanded ? "max-w-[190px] opacity-100" : "max-w-0 opacity-0",
          ].join(" ")}
        >
          <p className="whitespace-nowrap text-[15px] font-bold text-[var(--cf-text)]">
            CodeForge
          </p>
          <p className="whitespace-nowrap text-[11px] font-medium text-[var(--cf-text-muted)]">
            Execute or fall behind
          </p>
        </div>
      </div>

      <nav
        className={[
          "flex-1 py-4",
          expanded
            ? "overflow-y-auto px-4 custom-sidebar-scroll"
            : "overflow-hidden px-3",
        ].join(" ")}
      >
        <div className="space-y-5">
          {navSections.map((section) => (
            <div key={section.label} className="relative">
              <p
                className={[
                  "mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cf-text-muted)] transition-all duration-300",
                  expanded ? "opacity-100" : "opacity-0",
                ].join(" ")}
              >
                {section.label}
              </p>

              <div
                className={[
                  "space-y-1.5",
                  expanded ? "border-l border-[var(--cf-primary)]/20 pl-3" : "",
                ].join(" ")}
              >
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={[
                        "group relative flex h-14 w-full items-center rounded-2xl transition-all duration-300",
                        expanded ? "justify-start gap-4 px-4" : "justify-center px-0",
                        active
                          ? "bg-[var(--cf-primary)]/14 text-[var(--cf-accent)] ring-1 ring-[var(--cf-primary)]/30 shadow-[0_0_22px_var(--cf-glow)]"
                          : "text-[var(--cf-text-secondary)] hover:bg-[var(--cf-card)] hover:text-[var(--cf-text)]",
                      ].join(" ")}
                    >
                      {expanded && active ? (
                        <span className="absolute -left-[13px] h-7 w-[2px] rounded-full bg-[var(--cf-accent)]" />
                      ) : null}

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                        <SidebarIcon src={item.iconSrc} active={active} />
                      </div>

                      <span
                        className={[
                          "overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300",
                          expanded
                            ? "max-w-[180px] opacity-100"
                            : "max-w-0 opacity-0",
                        ].join(" ")}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--cf-border)] p-3">
        <div
          className={[
            "overflow-hidden rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-card)]",
            expanded ? "p-3" : "hidden",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] text-xs font-black text-[var(--cf-text)]">
              {user?.username?.slice(0, 2).toUpperCase() || "CF"}
            </div>

            <div
              className={[
                "min-w-0 overflow-hidden transition-all duration-300",
                expanded ? "max-w-[190px] opacity-100" : "max-w-0 opacity-0",
              ].join(" ")}
            >
              <p className="truncate text-sm font-bold text-[var(--cf-text)]">
                {user?.username || "CodeForge user"}
              </p>
              <p className="truncate text-[11px] text-[var(--cf-text-muted)]">
                {subscriptionTier.toUpperCase()} PLAN
              </p>
            </div>
          </div>

          <div
            className={[
              "overflow-hidden transition-all duration-300",
              expanded ? "mt-3 max-h-28 opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
          >
            {!isUltra ? (
              <Link
                href="/subscription"
                className="mb-2 block rounded-xl border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/10 px-3 py-2 text-center text-xs font-bold text-[var(--cf-accent)] transition hover:bg-[var(--cf-primary)]/18 hover:text-[var(--cf-text)]"
              >
                Upgrade execution
              </Link>
            ) : null}

            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}