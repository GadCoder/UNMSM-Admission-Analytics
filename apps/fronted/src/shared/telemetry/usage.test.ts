import { afterEach, beforeEach, expect, it, vi } from "vitest";
const sendUsage = vi.hoisted(() => vi.fn());
vi.mock("./web", () => ({ sendUsage }));
beforeEach(() => {
  vi.resetModules();
  sendUsage.mockReset();
  vi.stubEnv("VITE_FARO_URL", "https://telemetry.example.com/collect");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("does not send when disabled or Do Not Track is enabled", async () => {
  const { trackUsage } = await import("./usage");
  vi.stubEnv("VITE_FARO_URL", "");
  trackUsage("page_viewed", { page: "careers" });
  vi.stubEnv("VITE_FARO_URL", "https://telemetry.example.com/collect");
  vi.stubGlobal("navigator", { doNotTrack: "1" });
  trackUsage("page_viewed", { page: "careers" });
  expect(sendUsage).not.toHaveBeenCalled();
});
it("only forwards allowed fields and rejects oversized attributes", async () => {
  const { trackUsage } = await import("./usage");
  trackUsage("career_viewed", {
    major_id: "11",
    process_id: "2",
    modality: "a".repeat(129),
    query: "private text",
    url: "https://example.com/?secret",
  });
  await vi.waitFor(() =>
    expect(sendUsage).toHaveBeenCalledWith("career_viewed", {
      major_id: "11",
      process_id: "2",
      visit_session_id: expect.any(String),
    }),
  );
});
it("does not throw when telemetry delivery fails", async () => {
  sendUsage.mockImplementation(() => {
    throw new Error("collector unavailable");
  });
  const { trackUsage } = await import("./usage");
  expect(() => trackUsage("page_viewed", { page: "comparison" })).not.toThrow();
  await vi.waitFor(() => expect(sendUsage).toHaveBeenCalled());
});
