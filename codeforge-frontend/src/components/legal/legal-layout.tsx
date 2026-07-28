"use client";

import Link from "next/link";
import { ArrowLeft, Shield, FileText, Receipt } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

const legalLinks = [
  {
    href: "/legal/terms",
    label: "Terms",
    icon: FileText,
  },
  {
    href: "/legal/privacy",
    label: "Privacy",
    icon: Shield,
  },
  {
    href: "/legal/refund",
    label: "Refund",
    icon: Receipt,
  },
];

export function LegalLayout({
  title,
  updatedAt,
  children,
}: LegalLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--cf-bg)] text-[var(--cf-text)]">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_28%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_34%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.35))]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8 md:py-14">
        {/* top */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-[var(--cf-text-secondary)] backdrop-blur-xl transition hover:border-[var(--cf-primary)]/40 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="mt-8">
              <p className="text-xs font-black uppercase tracking-[0.38em] text-[var(--cf-accent)]">
                Legal
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--cf-text)] md:text-6xl">
                {title}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--cf-text-secondary)] md:text-base">
                Important information regarding the use of CodeForge,
                subscriptions, user rights, platform responsibilities,
                and data handling.
              </p>

              <div className="mt-5 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--cf-text-muted)]">
                Last updated • {updatedAt}
              </div>
            </div>
          </div>

          {/* desktop nav */}
          <aside className="hidden lg:sticky lg:top-8 lg:block">
            <div className="w-[240px] rounded-[30px] border border-white/10 bg-[rgba(18,18,28,0.72)] p-4 shadow-[0_0_60px_rgba(124,92,255,0.10)] backdrop-blur-2xl">
              <p className="px-3 pb-3 text-xs font-black uppercase tracking-[0.22em] text-[var(--cf-text-muted)]">
                Documents
              </p>

              <nav className="space-y-2">
                {legalLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/30 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition group-hover:border-[var(--cf-primary)]/30 group-hover:bg-[var(--cf-primary)]/10">
                        <Icon className="h-4 w-4" />
                      </div>

                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>

        {/* mobile nav */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {legalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--cf-text-secondary)] backdrop-blur-xl transition hover:border-[var(--cf-primary)]/40 hover:text-[var(--cf-accent)]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* content */}
        <div className="mt-8 lg:pr-[280px]">
          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[rgba(18,18,28,0.72)] shadow-[0_0_100px_rgba(124,92,255,0.12)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]" />

            <div className="relative z-10 p-5 sm:p-7 md:p-10 lg:p-14">
              <article className="legal-content space-y-10 text-[15px] leading-8 text-[var(--cf-text-secondary)] md:text-base md:leading-9">
                {children}
              </article>
            </div>
          </div>

          {/* footer */}
          <footer className="mt-8 border-t border-white/10 pt-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-[var(--cf-text)]">
                  CodeForge
                </p>

                <p className="mt-2 max-w-xl text-xs leading-6 text-[var(--cf-text-muted)]">
                  Proof-based execution platform for developers.
                  Learn through real implementation, verification,
                  and practical progression.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {legalLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cf-text-muted)] transition hover:text-[var(--cf-accent)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] leading-6 text-[var(--cf-text-muted)]">
              This page is provided for transparency and does not replace
              independent legal advice.
            </p>
          </footer>
        </div>
      </div>
      {/* typography */}
    </main>
  );
}