"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import AuthGuard from "@/components/auth/auth-guard";
import PublicRoute from "@/components/auth/public-route";
import NotificationBell from "@/components/notifications/notification-bell";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <PublicRoute>{children}</PublicRoute>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)]">
        <Sidebar />
        <NotificationBell />

        <main className="pl-20 transition-all duration-300 lg:pl-20">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}