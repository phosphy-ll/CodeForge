import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a50db7ea93ffb89e4f873cb34c851a55@o4511417277415424.ingest.de.sentry.io/4511417278005328",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1,
  enableLogs: process.env.NODE_ENV !== "production",
  sendDefaultPii: false,
});
