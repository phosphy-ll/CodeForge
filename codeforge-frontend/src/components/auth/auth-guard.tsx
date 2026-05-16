"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getAccessToken, logout } from "@/lib/auth";
import { getMe } from "@/lib/user";

type AuthGuardProps = {
  children: React.ReactNode;
};

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/verify-email",
  "/legal",
  "/subscription",
];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        pathname.startsWith(route)
      );

      if (isPublicRoute) {
        setLoading(false);
        return;
      }

      const token = getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await getMe();
        setLoading(false);
      } catch {
        logout();
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070a] text-sm text-white/55">
        Loading CodeForge...
      </div>
    );
  }

  return <>{children}</>;
}