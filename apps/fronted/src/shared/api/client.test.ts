import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./client";
import { startApiSpan } from "../telemetry/apiTracing";
vi.mock("../telemetry/apiTracing", () => ({ startApiSpan: vi.fn() }));
beforeEach(() => {
  vi.mocked(startApiSpan).mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});
it("propagates a sampled span while preserving caller headers and JSON", async () => {
  const finish = vi.fn();
  vi.mocked(startApiSpan).mockReturnValue({ traceparent: "00-trace-span-01", finish });
  const fetch = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  expect(await apiFetch("/api/v1/", { headers: new Headers({ "X-Test": "yes" }) })).toEqual({
    ok: true,
  });
  const headers = fetch.mock.calls[0][1].headers as Headers;
  expect(headers.get("traceparent")).toBe("00-trace-span-01");
  expect(headers.get("X-Test")).toBe("yes");
  expect(finish).toHaveBeenCalledWith(200, false);
});
it("ends failed requests and preserves their original exception", async () => {
  const finish = vi.fn(() => {
    throw new Error("telemetry failed");
  });
  vi.mocked(startApiSpan).mockReturnValue({ traceparent: "trace", finish });
  const error = new TypeError("network failed");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
  await expect(apiFetch("/api/v1/")).rejects.toBe(error);
  expect(finish).toHaveBeenCalledWith(undefined, true);
});
it("preserves API errors and ordinary requests before tracing loads", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 404 }));
  vi.stubGlobal("fetch", fetch);
  await expect(apiFetch("/api/v1/")).rejects.toBeInstanceOf(ApiError);
  expect((fetch.mock.calls[0][1].headers as Headers).has("traceparent")).toBe(false);
});

it("marks malformed successful JSON as a failed client operation", async () => {
  const finish = vi.fn();
  vi.mocked(startApiSpan).mockReturnValue({ traceparent: "trace", finish });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not JSON", { status: 200 })));
  await expect(apiFetch("/api/v1/")).rejects.toBeInstanceOf(SyntaxError);
  expect(finish).toHaveBeenCalledWith(200, true);
});
