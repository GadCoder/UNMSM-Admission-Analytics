import { afterEach, expect, it, vi } from "vitest";
import type { Faro } from "@grafana/faro-web-sdk";
import { enableTracing } from "./tracing";
import { registerApiTracer } from "./apiTracing";
vi.mock("./apiTracing", () => ({ registerApiTracer: vi.fn() }));
vi.mock("@grafana/faro-web-tracing", () => ({ TracingInstrumentation: vi.fn() }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("traces only the configured API, strips query/IDs, and sets W3C context", () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/api/v1");
  vi.stubEnv("VITE_TRACE_SAMPLE_RATE", "1");
  const span = {
    spanContext: () => ({ traceId: "a".repeat(32), spanId: "b".repeat(16) }),
    setAttribute: vi.fn(),
    setStatus: vi.fn(),
    end: vi.fn(),
  };
  const startSpan = vi.fn((_name: string, _options: unknown) => span);
  const faro = {
    metas: { add: vi.fn() },
    instrumentations: { add: vi.fn() },
    api: { getOTEL: () => ({ trace: { getTracer: () => ({ startSpan }) } }) },
  };
  enableTracing(faro as unknown as Faro);
  const start = vi.mocked(registerApiTracer).mock.calls.at(-1)![0];
  expect(start("https://third-party.example.com/api/v1/", "GET")).toBeUndefined();
  expect(start("https://api.example.com/api/v10/", "GET")).toBeUndefined();
  const request = start(
    "https://api.example.com/api/v1/analytics/majors/11/?private=secret",
    "GET",
  );
  expect(request?.traceparent).toBe(`00-${"a".repeat(32)}-${"b".repeat(16)}-01`);
  expect(JSON.stringify(startSpan.mock.calls)).not.toContain("secret");
  expect(startSpan.mock.calls[0][0]).toBe("GET /api/v1/analytics/majors/:id/");
  request?.finish(503);
  expect(span.end).toHaveBeenCalledOnce();
  expect(span.setStatus).toHaveBeenCalled();
});
it("a zero trace sample rate does not create spans", () => {
  vi.stubEnv("VITE_TRACE_SAMPLE_RATE", "0");
  const startSpan = vi.fn();
  enableTracing({
    metas: { add() {} },
    instrumentations: { add() {} },
    api: { getOTEL: () => ({ trace: { getTracer: () => ({ startSpan }) } }) },
  } as unknown as Faro);
  const start = vi.mocked(registerApiTracer).mock.calls.at(-1)![0];
  expect(start("http://localhost:8000/api/v1/", "GET")).toBeUndefined();
  expect(startSpan).not.toHaveBeenCalled();
});
