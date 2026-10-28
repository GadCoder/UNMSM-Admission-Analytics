import { afterEach, expect, it, vi } from "vitest";
import { initializeFaro } from "@grafana/faro-web-sdk";
import { trace } from "@opentelemetry/api";
import { enableTracing } from "./tracing";
import { startApiSpan } from "./apiTracing";

afterEach(() => {
  vi.unstubAllEnvs();
  trace.disable();
});
it("exports sampled spans through real Faro without creating a session identity", async () => {
  vi.stubEnv("VITE_TRACING_ENABLED", "true");
  vi.stubEnv("VITE_TRACE_SAMPLE_RATE", "1");
  vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/api/v1");
  const faro = initializeFaro({
    app: { name: "unmsm-frontend" },
    instrumentations: [],
    transports: [],
    metas: [],
    sessionTracking: { enabled: false },
    preventGlobalExposure: true,
  });
  if (!faro) throw new Error("Faro did not initialize");
  const exported = vi.spyOn(faro.api, "pushTraces");
  enableTracing(faro);
  const span = startApiSpan(
    "https://api.example.com/api/v1/analytics/history/?private=secret",
    "GET",
  );
  expect(span?.traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
  span?.finish(200);
  await vi.waitFor(() => expect(exported).toHaveBeenCalled(), { timeout: 3000 });
  expect(JSON.stringify(exported.mock.calls)).not.toContain("secret");
  expect(faro.metas.value.session?.id).toBeUndefined();
  expect(faro.metas.value.page).toBeUndefined();
});
