import { api } from "@/lib/api";

const SESSION_KEY = "codeforge_analytics_session_id";

function getSessionId() {
  if (typeof window === "undefined") return null;

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

export async function trackEvent(
  eventName: string,
  metadata?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  try {
    await api.post("/analytics/events", {
      event_name: eventName,
      session_id: getSessionId(),
      path: window.location.pathname,
      metadata: metadata || null,
    });
  } catch {
    // analytics should never break UX
  }
}