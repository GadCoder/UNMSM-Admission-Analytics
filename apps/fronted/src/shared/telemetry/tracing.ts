import { SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import type { Faro } from "@grafana/faro-web-sdk";
import { registerApiTracer } from "./apiTracing";

export function enableTracing(faro: Faro) {
  // Faro's trace sampler needs a sampled marker; no session ID or persistence.
  // Actual request sampling happens below, independently of all usage events.
  faro.metas.add({ session: { attributes: { isSampled: "true" } } });
  faro.instrumentations.add(new TracingInstrumentation({ instrumentations: [] }));
  const otel = faro.api.getOTEL();
  if (!otel) return;
  const tracer = otel.trace.getTracer("unmsm-api-client");
  const api = new URL(
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
    location.origin,
  );
  const configured = Number(import.meta.env.VITE_TRACE_SAMPLE_RATE ?? "0.1");
  const ratio =
    Number.isFinite(configured) && configured >= 0 && configured <= 1 ? configured : 0.1;
  registerApiTracer((rawUrl, method) => {
    const url = new URL(rawUrl, location.origin);
    const prefix = `${api.pathname.replace(/\/$/, "")}/`;
    if (url.origin !== api.origin || !url.pathname.startsWith(prefix) || Math.random() >= ratio)
      return;
    // Never record query parameters, fragments, arbitrary error text, or headers.
    const route = url.pathname.replace(/\/\d+(?=\/|$)/g, "/:id");
    const span = tracer.startSpan(`${method} ${route}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        "http.request.method": method,
        "server.address": url.hostname,
        "http.route": route,
      },
    });
    const ctx = span.spanContext();
    return {
      traceparent: `00-${ctx.traceId}-${ctx.spanId}-01`,
      finish(status, failed = false) {
        if (status !== undefined) span.setAttribute("http.response.status_code", status);
        if (failed || status === undefined || status >= 400)
          span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
      },
    };
  });
}
