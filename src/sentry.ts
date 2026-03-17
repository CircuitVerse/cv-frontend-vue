import * as Sentry from "@sentry/vue";
import type { App } from "vue";

export function initSentry(app: App) {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // Skip if no DSN set (safe for local dev)

  Sentry.init({
    app,
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  });
}