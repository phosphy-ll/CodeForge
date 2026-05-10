"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type NotificationItem = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);

      const [itemsResponse, countResponse] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ]);

      setItems(Array.isArray(itemsResponse.data) ? itemsResponse.data : []);
      setUnreadCount(Number(countResponse.data?.count || 0));
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  async function handleOpenNotification(item: NotificationItem) {
    try {
      if (!item.is_read) {
        await api.post(`/notifications/${item.id}/read`);
      }

      setOpen(false);
      await loadNotifications();

      if (item.action_url) {
        router.push(item.action_url);
      }
    } catch {
      if (item.action_url) {
        router.push(item.action_url);
      }
    }
  }

  async function markAllRead() {
    try {
      await api.post("/notifications/read-all");
      await loadNotifications();
    } catch {
      // silent
    }
  }

  return (
    <div className="fixed right-6 top-6 z-[80]">
      <button
        onClick={() => setOpen((value) => !value)}
        className={[
          "group relative flex h-12 w-12 items-center justify-center rounded-2xl",
          "border border-[var(--cf-border)] bg-[var(--cf-card)] text-[var(--cf-text)]",
          "shadow-[0_14px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-300",
          "hover:border-[var(--cf-primary)]/45 hover:bg-[var(--cf-primary)]/10 hover:shadow-[0_16px_46px_var(--cf-glow)]",
        ].join(" ")}
        aria-label="Notifications"
      >
        <span className="relative z-10 text-lg">⚡</span>

        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 z-20 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--cf-primary)] px-2 text-[11px] font-black leading-none text-white shadow-[0_0_18px_var(--cf-glow)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-[360px] overflow-hidden rounded-[28px] border border-[var(--cf-border)] bg-[var(--cf-card)] shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[var(--cf-border)] px-5 py-4">
            <div>
              <p className="text-sm font-black text-[var(--cf-text)]">
                Notifications
              </p>
              <p className="mt-1 text-xs text-[var(--cf-text-muted)]">
                CodeForge system signals
              </p>
            </div>

            <button
              onClick={markAllRead}
              className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] px-3 py-2 text-xs font-bold text-[var(--cf-text-secondary)] transition hover:border-[var(--cf-primary)]/40 hover:text-[var(--cf-accent)]"
            >
              Read all
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-3 custom-sidebar-scroll">
            {loading ? (
              <div className="space-y-3 p-2">
                <div className="h-20 animate-pulse rounded-2xl bg-[var(--cf-bg-secondary)]" />
                <div className="h-20 animate-pulse rounded-2xl bg-[var(--cf-bg-secondary)]" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-bold text-[var(--cf-text)]">
                  No signals yet
                </p>
                <p className="mt-2 text-xs text-[var(--cf-text-muted)]">
                  Execute something. The system responds to movement.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleOpenNotification(item)}
                    className={[
                      "group w-full rounded-2xl border p-4 text-left transition-all duration-300",
                      item.is_read
                        ? "border-[var(--cf-border)] bg-[var(--cf-bg-secondary)] opacity-75 hover:opacity-100"
                        : "border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 shadow-[0_0_22px_var(--cf-glow)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[var(--cf-text)]">
                          {item.title}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--cf-text-secondary)]">
                          {item.message}
                        </p>
                      </div>

                      {!item.is_read ? (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--cf-primary)] shadow-[0_0_14px_var(--cf-glow)]" />
                      ) : null}
                    </div>

                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cf-text-muted)]">
                      {formatType(item.type)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatType(value: string) {
  return value.replaceAll("_", " ");
}