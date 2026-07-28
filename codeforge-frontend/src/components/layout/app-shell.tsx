"use client";

import { useCallback, useEffect, useState } from "react";
import GuidedTour from "@/components/onboarding/guided-tour";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import AuthGuard from "@/components/auth/auth-guard";
import PublicRoute from "@/components/auth/public-route";
import NotificationBell from "@/components/notifications/notification-bell";
import { api } from "@/lib/api";

type AppShellProps = {
  children: React.ReactNode;
};

type GoalLike = {
  id?: string | number;
  status?: string;
  is_active?: boolean;
  deleted_at?: string | null;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const [hasActiveGoal, setHasActiveGoal] = useState<boolean | null>(null);

  const isLandingPage = pathname === "/";
  const isLegalPage = pathname.startsWith("/legal");

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify-email";

  const loadGoalState = useCallback(async () => {
    try {
      const res = await api.get("/goals");
      const data = res.data;

      const goals: GoalLike[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.goals)
            ? data.goals
            : [];

      const activeGoal = goals.find((goal) => {
        if (goal.deleted_at) return false;

        const status = goal.status?.toLowerCase();

        return (
          goal.is_active === true ||
          status === "active" ||
          status === "in_progress" ||
          status === "ready"
        );
      });

      setHasActiveGoal(Boolean(activeGoal));
    } catch (error) {
      console.error("Failed to load goal state:", error);
      setHasActiveGoal(false);
    }
  }, []);

  useEffect(() => {
    if (isLandingPage || isLegalPage || isAuthPage) return;

    loadGoalState();

    window.addEventListener("codeforge:goal-created", loadGoalState);
    window.addEventListener("codeforge:goal-updated", loadGoalState);
    window.addEventListener("codeforge:goal-deleted", loadGoalState);

    return () => {
      window.removeEventListener("codeforge:goal-created", loadGoalState);
      window.removeEventListener("codeforge:goal-updated", loadGoalState);
      window.removeEventListener("codeforge:goal-deleted", loadGoalState);
    };
  }, [isLandingPage, isLegalPage, isAuthPage, loadGoalState]);

  if (isLandingPage || isLegalPage) {
    return (
      <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)]">
        {children}
      </div>
    );
  }

  if (isAuthPage) {
    return <PublicRoute>{children}</PublicRoute>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)]">
        <Sidebar />
        <NotificationBell />

        <main className="pb-24 transition-all duration-300 md:pl-20 md:pb-0">
          <div className="px-4 py-5 sm:px-5 md:p-8">{children}</div>
        </main>

        {hasActiveGoal !== null ? (
          <GuidedTour hasActiveGoal={hasActiveGoal} />
        ) : null}

        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}