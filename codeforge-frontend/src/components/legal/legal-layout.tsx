interface LegalLayoutProps {
  title: string
  updatedAt: string
  children: React.ReactNode
}

export function LegalLayout({
  title,
  updatedAt,
  children,
}: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-[var(--cf-bg)] text-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-14">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-[#8b5cf6]">
            Legal
          </p>

          <h1 className="text-5xl font-black tracking-tight">
            {title}
          </h1>

          <p className="mt-4 text-sm text-white/45">
            Last updated: {updatedAt}
          </p>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#141028] to-[#09090f] p-10 shadow-[0_0_80px_rgba(124,92,255,0.12)]">
          <article className="legal-content space-y-8 text-[15px] leading-8 text-white/82">
            {children}
          </article>
        </div>
      </div>
    </main>
  )
}