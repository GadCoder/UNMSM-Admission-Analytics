import { initializeFaro } from "@grafana/faro-web-sdk";

const faro = initializeFaro({
  url: import.meta.env.VITE_FARO_URL,
  app: { name: "unmsm-frontend", environment: import.meta.env.MODE },
  // Only explicitly emitted events: no console capture, URL/referrer metadata,
  // automatic clicks, persistent identity, or session replay.
  instrumentations: [],
  metas: [],
  sessionTracking: { enabled: false },
  preventGlobalExposure: true,
  dedupe: false,
  batching: { enabled: true, sendTimeout: 1000, itemLimit: 25 },
});

export function sendUsage(name: string, attributes: Record<string, string>) {
  faro?.api.pushEvent(name, attributes, "usage");
}

// Optional tracing loads after usage initialization; usage collection is unsampled.
if (faro && import.meta.env.VITE_TRACING_ENABLED === "true") {
  void import("./tracing")
    .then(({ enableTracing }) => enableTracing(faro))
    .catch(() => {
      // SDK loading/configuration failures leave ordinary API calls unaffected.
    });
}
