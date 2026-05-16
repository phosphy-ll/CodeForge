"use client";

import GuidedTour from "@/components/onboarding/guided-tour";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import AuthGuard from "@/components/auth/auth-guard";
import PublicRoute from "@/components/auth/public-route";
import NotificationBell from "@/components/notifications/notification-bell";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify-email";

  const isLegalPage = pathname.startsWith("/legal");

  if (isAuthPage) {
    return <PublicRoute>{children}</PublicRoute>;
  }

  if (isLegalPage) {
    return (
      <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)]">
        {children}
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)]">
        <Sidebar />
        <NotificationBell />

        <main className="pb-24 transition-all duration-300 md:pl-20 md:pb-0">
          <div className="px-4 py-5 sm:px-5 md:p-8">{children}</div>
        </main>

        <GuidedTour />
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}