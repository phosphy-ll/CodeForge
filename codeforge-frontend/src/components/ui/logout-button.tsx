"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { logout } from "@/lib/auth";

type LogoutButtonProps = {
  mobile?: boolean;
};

export default function LogoutButton({
  mobile = false,
}: LogoutButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleLogout() {
    logout();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={
          mobile
            ? "mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm font-bold text-rose-300 transition-all duration-300 hover:bg-rose-500/20 active:scale-[0.98]"
            : "flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--cf-text)] transition-all duration-200 hover:border-[var(--cf-primary)]/40 hover:bg-[var(--cf-primary)]/10 hover:text-[var(--cf-accent)]"
        }
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

      <div
        className={[
          "fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm transition-all duration-300",
          confirmOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <div
          className={[
            "w-full max-w-sm rounded-[32px] border border-[var(--cf-border)] bg-[var(--cf-card)] p-6 shadow-[0_0_60px_rgba(0,0,0,0.45)] transition-all duration-300",
            confirmOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-[0.96] opacity-0",
          ].join(" ")}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
            <LogOut className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-2xl font-black text-[var(--cf-text)]">
            Logout?
          </h2>

          <p className="mt-3 text-sm leading-7 text-[var(--cf-text-secondary)]">
            Your current session will be closed on this device.
          </p>

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="flex-1 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-4 py-3 text-sm font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/30 hover:text-[var(--cf-text)]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}