"use client";

type StreakProgressBarProps = {
  current: number;
};

export default function StreakProgressBar({
  current,
}: StreakProgressBarProps) {
  const safeCurrent = Math.max(0, Math.min(current, 300));

  const totalPercent = (safeCurrent / 300) * 100;

  const secured = safeCurrent >= 100;
  const bonus = safeCurrent >= 300;

  return (
    <div className="space-y-3">
      <div className="relative">
        {/* MARKERS */}
        <div className="relative mb-2 h-4">
          <span className="absolute left-1/3 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
            +1
          </span>

          <span className="absolute right-0 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
            +2
          </span>
        </div>

        {/* BAR */}
        <div className="relative h-10 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] p-[4px] shadow-[0_20px_60px_rgba(0,0,0,0.30)] backdrop-blur-xl">
          {/* glass bg */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.06))]" />

          {/* 100 marker */}
          <div className="absolute left-1/3 top-0 z-20 h-full w-px bg-white/20" />

          {/* progress */}
          <div
            className="
              relative h-full overflow-hidden rounded-full
              transition-all duration-700 ease-out
            "
            style={{
              width: `${totalPercent}%`,
              background:
                safeCurrent < 100
                  ? "linear-gradient(90deg,#A78BFA,#C4B5FD,#DDD6FE)"
                  : "linear-gradient(90deg,#8B5CF6,#A855F7,#C084FC)",
              boxShadow:
                safeCurrent < 100
                  ? "0 0 24px rgba(196,181,253,0.35)"
                  : "0 0 32px rgba(168,85,247,0.45)",
            }}
          >
            {/* liquid shine */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div
                className="
                  absolute top-[-40%]
                  h-[180%]
                  w-[35%]
                  rotate-12
                  bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)]
                  blur-lg
                  animate-[glassFlow_2.8s_linear_infinite]
                "
              />
            </div>

            {/* gloss */}
            <div className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.30),rgba(255,255,255,0.08)_45%,rgba(255,255,255,0.18))]" />
          </div>
        </div>

        {/* labels */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                secured ? "bg-violet-400" : "bg-white/20"
              }`}
            />

            <span
              className={
                secured ? "text-violet-200" : "text-white/35"
              }
            >
              Base streak secured
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                bonus ? "bg-fuchsia-400" : "bg-white/20"
              }`}
            />

            <span
              className={
                bonus ? "text-fuchsia-200" : "text-white/35"
              }
            >
              Bonus streak
            </span>
          </div>
        </div>
      </div>

      {/* bottom numbers */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/45">
          {safeCurrent < 100
            ? `${100 - safeCurrent} pts until streak`
            : safeCurrent < 300
            ? `${300 - safeCurrent} pts until bonus`
            : "Maximum streak bonus secured"}
        </p>

        <p className="text-xl font-black text-white">
          {safeCurrent}/300
        </p>
      </div>
    </div>
  );
}