export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const ui = {
  page: "space-y-8",

  card:
    "rounded-3xl border border-white/10 bg-white/[0.03]",

  cardPadded:
    "rounded-3xl border border-white/10 bg-white/[0.03] p-6",

  innerCard:
    "rounded-3xl border border-white/10 bg-black/20 p-6",

  title:
    "text-3xl font-bold tracking-tight text-white",

  sectionTitle:
    "text-2xl font-semibold text-white",

  muted:
    "text-sm leading-7 text-white/50",

  label:
    "text-sm font-semibold text-white/80",

  input:
    "w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition-all duration-300 placeholder:text-white/30 hover:border-violet-500/20 focus:border-violet-400/40 focus:bg-black/40",

  textarea:
    "w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition-all duration-300 placeholder:text-white/30 hover:border-violet-500/20 focus:border-violet-400/40 focus:bg-black/40",

  primaryButton:
    "rounded-2xl bg-violet-500/20 px-6 py-3 text-sm font-semibold text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.10)] transition-all duration-300 hover:bg-violet-500/30 hover:text-white hover:scale-[1.02] hover:shadow-[0_0_34px_rgba(139,92,246,0.18)] active:scale-[0.98]",

  secondaryButton:
    "rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-white/70 transition-all duration-300 hover:bg-violet-500/15 hover:text-white hover:border-violet-500/20",

  disabledButton:
    "cursor-not-allowed rounded-2xl bg-white/5 px-6 py-3 text-sm font-semibold text-white/25",

  pill:
    "rounded-2xl border border-white/10 bg-black/20 px-4 py-3",

  presetCard:
    "rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-left text-white/65 transition-all duration-300 hover:border-violet-500/25 hover:bg-violet-500/10 hover:text-white",

  presetCardActive:
    "rounded-2xl border border-transparent bg-violet-500/15 px-5 py-4 text-left text-white shadow-[0_0_24px_rgba(139,92,246,0.12)] transition-all duration-300",

  tooltip:
    "pointer-events-none absolute left-1/2 top-full z-50 mt-3 w-80 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#08080c] px-5 py-4 text-sm leading-7 text-white/80 opacity-0 shadow-[0_18px_45px_rgba(0,0,0,0.75)] transition-all duration-200 group-hover:opacity-100",

  iconInfo:
    "flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-white/50 transition group-hover:border-violet-400 group-hover:text-violet-300",
};