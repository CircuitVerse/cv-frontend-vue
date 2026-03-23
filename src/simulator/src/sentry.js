import * as Sentry from "@sentry/browser";

export function initSentry() {
  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,

    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    environment: isLocalDev ? "development" : "production",

    tracesSampleRate: 1.0,

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