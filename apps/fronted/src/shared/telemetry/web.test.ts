import { expect, it, vi } from "vitest";
const initializeFaro = vi.hoisted(() => vi.fn(() => ({ api: { pushEvent: vi.fn() } })));
vi.mock("@grafana/faro-web-sdk", () => ({ initializeFaro }));
it("disables automatic metadata, instrumentations and session tracking", async () => {
  vi.stubEnv("VITE_FARO_URL", "https://telemetry.example.com/collect");
  const { sendUsage } = await import("./web");
  sendUsage("page_viewed", { page: "careers" });
  expect(initializeFaro).toHaveBeenCalledWith(
    expect.objectContaining({
      metas: [],
      instrumentations: [],
      sessionTracking: { enabled: false },
      preventGlobalExposure: true,
    }),
  );
  expect(initializeFaro.mock.results[0].value.api.pushEvent).toHaveBeenCalledWith(
    "page_viewed",
    { page: "careers" },
    "usage",
  );
  vi.unstubAllEnvs();
});
