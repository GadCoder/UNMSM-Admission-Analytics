import { describe, expect, it, vi } from "vitest";
import { getAnalyticsOverview, getPublishedProcesses } from "./analytics";

describe("analytics API", () => {
  it("fetches published processes", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("[]"));
    await getPublishedProcesses();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/processes/", expect.objectContaining({
      headers: { Accept: "application/json" },
    }));
    fetchMock.mockRestore();
  });

  it("encodes primary and comma-separated comparison IDs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"processes":[]}'));
    await getAnalyticsOverview("12", ["4", "9"]);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/analytics/overview/?process=12&compare=4%2C9");
    fetchMock.mockRestore();
  });

  it("encodes analytics dimension filters", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"processes":[]}'));
    await getAnalyticsOverview("12", [], { academicArea: "A", faculty: "F01", modality: "Ordinario" });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/analytics/overview/?process=12&academic_area=A&faculty=F01&modality=Ordinario");
    fetchMock.mockRestore();
  });
});
