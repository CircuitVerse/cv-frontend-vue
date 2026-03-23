import * as Sentry from "@sentry/browser";

export function initSentry() {
  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn("⚠️ Sentry DSN not found. Error tracking is disabled.");
    return;
  }

  const getTracesSampleRate = () => {
    if (isLocalDev) return 1.0;
    const rate = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE);
    return Number.isFinite(rate) ? rate : 0.1;
  };

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    environment: isLocalDev ? "development" : "production",
    tracesSampleRate: getTracesSampleRate(),
    beforeSend(event) {
      if (isLocalDev) {
        console.log("⚠️ Sentry blocked (development mode):", event);
        return null;
      }
      return event;
    },
    initialScope: {
      tags: {
        application: "circuitverse-simulator",
      },
    },
  });

  console.log("✅ Sentry initialized");
}