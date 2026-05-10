type LiquidGlassButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
};

export default function LiquidGlassButton({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: LiquidGlassButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-5 py-3",
        "border border-[var(--cf-primary)]/25 bg-[var(--cf-primary)]/12",
        "text-sm font-bold text-[var(--cf-text)]",
        "backdrop-blur-xl transition-all duration-300",
        "shadow-[0_12px_36px_var(--cf-glow)]",
        "before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.20),rgba(255,255,255,0.04))] before:opacity-60 before:transition-opacity before:duration-300",
        "after:absolute after:-left-1/3 after:top-0 after:h-full after:w-1/2 after:rotate-12 after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] after:opacity-0 after:transition-all after:duration-500",
        "hover:border-[var(--cf-primary)]/45 hover:bg-[var(--cf-primary)]/18",
        "hover:text-[var(--cf-accent)] hover:after:left-[120%] hover:after:opacity-100",
        "active:scale-[0.985]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}