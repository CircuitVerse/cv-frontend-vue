import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  Sentry.init({
    dsn: "https://5f707d900ca6bd2a13fbe838135c0742@o4510363436187648.ingest.us.sentry.io/4510363491237888",

    integrations: [
      new BrowserTracing({
        tracingOrigins: ["localhost", /^\//],
      }),
    ],

    environment: isLocalDev ? "development" : "production",

    tracesSampleRate: 1.0,

    beforeSend(event, hint) {
      // Prevent sending events while developing
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
