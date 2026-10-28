import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAnalyticsOverview,
  getMajorDetail,
  getProcessHistory,
  getPublishedProcesses,
} from "./analytics";

describe("analytics API", () => {
  afterEach(() => vi.restoreAllMocks());
  it("fetches published processes", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("[]"));
    await getPublishedProcesses();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/processes/",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("Accept")).toBe("application/json");
    fetchMock.mockRestore();
  });

  it("encodes primary and comma-separated comparison IDs", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"processes":[]}'));
    await getAnalyticsOverview("12", ["4", "9"]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/analytics/overview/?process=12&compare=4%2C9",
    );
    fetchMock.mockRestore();
  });

  it("encodes analytics dimension filters", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"processes":[]}'));
    await getAnalyticsOverview("12", [], {
      academicArea: "A",
      faculty: "F01",
      modality: "Ordinario",
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/analytics/overview/?process=12&academic_area=A&faculty=F01&modality=Ordinario",
    );
    fetchMock.mockRestore();
  });

  it("encodes historical analytics dimension filters", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"processes":[]}'));
    await getProcessHistory({ academicArea: "A", faculty: "F01", modality: "Ordinario" });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/analytics/history/?academic_area=A&faculty=F01&modality=Ordinario",
    );
    fetchMock.mockRestore();
  });
  it("requests selected and historical career scores together with an encoded modality", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    await getMajorDetail(42, 12, [], "Educación Básica");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/analytics/majors/42/?process=12&modality=Educaci%C3%B3n+B%C3%A1sica",
    );
    fetchMock.mockRestore();
  });
});
