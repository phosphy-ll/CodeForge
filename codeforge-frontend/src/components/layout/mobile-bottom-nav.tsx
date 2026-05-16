"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useState } from "react";

import SidebarIcon from "@/components/layout/sidebar-icon";
import LogoutButton from "@/components/ui/logout-button";

const mainItems = [
  { name: "Dashboard", href: "/dashboard", iconSrc: "/icons/dashboard.svg" },
  { name: "Today", href: "/today", iconSrc: "/icons/toda.svg" },
  { name: "Roadmap", href: "/roadmap", iconSrc: "/icons/roadmap.svg" },
  { name: "Practice", href: "/practice", iconSrc: "/icons/practice.svg" },
] as const;

const moreItems = [
  { name: "AI Coach", href: "/ai-coach", iconSrc: "/icons/ai-coach.svg" },
  { name: "Exams", href: "/exams", iconSrc: "/icons/exam.svg" },
  { name: "Submissions", href: "/submissions", iconSrc: "/icons/tasks.svg" },
  { name: "Weakness Map", href: "/weakness-map", iconSrc: "/icons/weakness_map.svg" },
  { name: "Leaderboard", href: "/leaderboard", iconSrc: "/icons/leaderboard.svg" },
  { name: "Achievements", href: "/achievements", iconSrc: "/icons/achievements.svg" },
  { name: "Subscription", href: "/subscription", iconSrc: "/icons/subscription.svg" },
  { name: "Settings", href: "/settings", iconSrc: "/icons/settings.svg" },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm transition-all duration-300 md:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute inset-0"
          aria-label="Close menu"
        />

        <div
          className={[
            "absolute bottom-0 left-0 right-0 rounded-t-[32px] border-t border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] p-5 pb-[calc(env(safe-area-inset-bottom)+92px)] shadow-[0_-20px_80px_rgba(0,0,0,0.55)] transition-all duration-300",
            open ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
          ].join(" ")}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xl font-black text-[var(--cf-text)]">Menu</p>
              <p className="text-sm text-[var(--cf-text-muted)]">
                Open any CodeForge section.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-card)] text-[var(--cf-text)]"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {moreItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "flex items-center gap-3 rounded-2xl border px-4 py-4 transition",
                    active
                      ? "border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/16 text-[var(--cf-accent)] shadow-[0_0_18px_var(--cf-glow)]"
                      : "border-[var(--cf-border)] bg-[var(--cf-card)] text-[var(--cf-text-secondary)]",
                  ].join(" ")}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    <SidebarIcon src={item.iconSrc} active={active} />
                  </div>

                  <span className="min-w-0 truncate text-sm font-bold">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <LogoutButton mobile />
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--cf-border)] bg-[var(--cf-bg-secondary)]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mainItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={[
                  "flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition",
                  active
                    ? "bg-[var(--cf-primary)]/16 text-[var(--cf-accent)] shadow-[0_0_18px_var(--cf-glow)]"
                    : "text-[var(--cf-text-muted)] active:bg-[var(--cf-card)]",
                ].join(" ")}
              >
                <div className="flex h-6 w-6 items-center justify-center">
                  <SidebarIcon src={item.iconSrc} active={active} />
                </div>

                <span className="max-w-full truncate">{item.name}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className={[
              "flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition active:bg-[var(--cf-card)]",
              open ? "text-[var(--cf-accent)]" : "text-[var(--cf-text-muted)]",
            ].join(" ")}
          >
            <div className="flex h-6 w-6 translate-y-[1px] items-center justify-center text-violet-300/80">
              <img
                src="/icons/menu.svg"
                alt=""
                className="h-[22px] w-[22px] object-contain opacity-90"
              />
            </div>

            <span className="leading-none text-violet-300/80">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}