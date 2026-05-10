"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, removeAccessToken } from "@/lib/auth";
import { getMe } from "@/lib/user";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await getMe();
        setLoading(false);
      } catch {
        removeAccessToken();
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070a] text-sm text-white/55">
        Loading CodeForge...
      </div>
    );
  }

  return <>{children}</>;
}