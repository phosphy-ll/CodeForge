import { useTheme } from "@/components/theme/theme-provider";

type SidebarIconProps = {
  src: string;
  active?: boolean;
};

export default function SidebarIcon({
  src,
  active = false,
}: SidebarIconProps) {
  const { theme } = useTheme();

  const baseColor =
    theme === "dark"
      ? "bg-white/85 group-hover:bg-violet-300"
      : "bg-black/80 group-hover:bg-violet-600";

  const activeColor =
    theme === "dark"
      ? "bg-violet-300 drop-shadow-[0_0_12px_rgba(139,92,246,0.8)]"
      : "bg-violet-600";

  return (
    <div className="relative h-7 w-7">
      <span
        className={[
          "relative block h-full w-full transition-all duration-300",
          "group-hover:scale-110",
          active ? activeColor : baseColor,
        ].join(" ")}
        style={{
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    </div>
  );
}