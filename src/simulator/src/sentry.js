import * as Sentry from "@sentry/browser";

export function initSentry() {
  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Validate DSN before initializing
  if (!dsn) {
    console.warn("⚠️ Sentry DSN not found. Error tracking is disabled.");
    return;
  }

  Sentry.init({
    dsn,

    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    environment: isLocalDev ? "development" : "production",

    // Use lower sample rate in production to avoid excessive costs
    tracesSampleRate: isLocalDev
      ? 1.0
      : parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),

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