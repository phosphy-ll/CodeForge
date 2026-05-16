import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface LegalLayoutProps {
  title: string
  updatedAt: string
  children: React.ReactNode
}

const legalLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/refund", label: "Refund" },
]

export function LegalLayout({
  title,
  updatedAt,
  children,
}: LegalLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--cf-bg)] text-[var(--cf-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.20),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.10),transparent_34%)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-[var(--cf-text-secondary)] backdrop-blur-xl transition hover:border-[var(--cf-primary)]/40 hover:text-[var(--cf-accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <nav className="flex flex-wrap gap-2">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--cf-text-muted)] backdrop-blur-xl transition hover:border-[var(--cf-primary)]/40 hover:text-[var(--cf-accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <header className="mb-10">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-[var(--cf-accent)]">
            Legal
          </p>

          <h1 className="text-4xl font-black tracking-tight text-[var(--cf-text)] md:text-6xl">
            {title}
          </h1>

          <p className="mt-4 text-sm text-[var(--cf-text-muted)]">
            Last updated: {updatedAt}
          </p>
        </header>

        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(18,18,28,0.70)] p-5 shadow-[0_0_80px_rgba(124,92,255,0.14)] backdrop-blur-2xl md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015))]" />

          <article className="legal-content relative z-10 space-y-8 text-sm leading-8 text-[var(--cf-text-secondary)] md:text-[15px]">
            {children}
          </article>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-[var(--cf-text-muted)]">
          This page is provided for transparency and does not replace independent legal advice.
        </p>
      </div>
    </main>
  )
}