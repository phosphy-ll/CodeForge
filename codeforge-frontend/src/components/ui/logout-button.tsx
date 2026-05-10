"use client";

import { removeAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    removeAccessToken();
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="
        w-full rounded-xl border border-[var(--cf-border)]
        bg-[var(--cf-bg-secondary)]
        px-4 py-3 text-sm font-semibold
        text-[var(--cf-text)]
        transition-all duration-200
        hover:border-[var(--cf-primary)]/40
        hover:bg-[var(--cf-primary)]/10
        hover:text-[var(--cf-accent)]
      "
    >
      Logout
    </button>
  );
}