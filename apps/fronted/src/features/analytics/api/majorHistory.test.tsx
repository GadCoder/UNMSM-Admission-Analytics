import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMajorDetail, majorHistoryQueryOptions, useMajorDetail } from "./analytics";
import type { AdmissionProcess, MajorDetail, MajorDetailProcess } from "./analytics.types";

const processes: AdmissionProcess[] = [
  { id: 2, year: 2026, sequence: "26-2", name: "Latest" },
  { id: 1, year: 2026, sequence: "26-1", name: "Previous" },
];
const period = (process: AdmissionProcess): MajorDetailProcess => ({
  process,
  total_results: process.id * 100,
  admitted_count: 10,
  absent_count: 0,
  average_score: "700",
  highest_score: "800",
});
const detail: MajorDetail = {
  major: {
    id: 42,
    code: "42",
    name: "Medicine",
    faculty: "Faculty",
    academic_area: "Area",
    is_new: false,
  },
  selected_processes: [period(processes[0])],
  history: [period(processes[1])],
};
const clients: QueryClient[] = [];

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  clients.push(client);
  client.setQueryData(["published-processes"], processes);
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(JSON.stringify(detail)));
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, fetch, wrapper };
}

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
});

describe("career history cache", () => {
  it("revalidates stale history when the selected period changes", async () => {
    const { client, fetch, wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ primary }) => useMajorDetail("42", primary, [], "EBR"),
      { wrapper, initialProps: { primary: "2" } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => {
      client.setQueryData(majorHistoryQueryOptions(42, "EBR", processes).queryKey, detail, {
        updatedAt: Date.now() - 61_000,
      });
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    rerender({ primary: "1" });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(result.current.data?.selected_processes[0].process.id).toBe(1);
  });

  it("selects periods locally and shares the same full response with comparison queries", async () => {
    const { client, fetch, wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ primary, comparisons }) => useMajorDetail("42", primary, comparisons, "EBR"),
      { wrapper, initialProps: { primary: "1", comparisons: [] as string[] } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.selected_processes[0].process.id).toBe(1);
    expect(result.current.data?.history[0].process.id).toBe(2);
    rerender({ primary: "2", comparisons: ["1"] });
    expect(result.current.data?.selected_processes.map((row) => row.process.id)).toEqual([2, 1]);
    expect(result.current.data?.history).toEqual([]);
    await client.fetchQuery({
      ...majorHistoryQueryOptions(42, "EBR", processes),
      queryFn: () => getMajorDetail(42, 2, [], "EBR"),
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0][0])).toContain("process=1");
  });

  it("isolates careers and modalities instead of showing previous metrics", async () => {
    const { fetch, wrapper } = setup();
    let resolveNext!: (response: Response) => void;
    const { result, rerender } = renderHook(
      ({ id, modality }) => useMajorDetail(id, "2", [], modality),
      { wrapper, initialProps: { id: "42", modality: "EBR" } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveNext = resolve;
        }),
    );
    rerender({ id: "42", modality: "Special" });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await act(async () => {
      resolveNext(new Response(JSON.stringify(detail)));
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ id: "43", modality: "Special" });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  });

  it("fetches newly published periods even while the old history is still fresh", async () => {
    const { client, fetch, wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ primary }) => useMajorDetail("42", primary, [], "EBR"),
      { wrapper, initialProps: { primary: "2" } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const latest = { id: 3, year: 2027, sequence: "27-1", name: "New" };
    fetch.mockImplementationOnce(
      async () =>
        new Response(
          JSON.stringify({
            ...detail,
            selected_processes: [period(latest)],
            history: [...detail.selected_processes, ...detail.history],
          }),
        ),
    );
    act(() => client.setQueryData(["published-processes"], [latest, ...processes]));
    rerender({ primary: "3" });
    await waitFor(() => expect(result.current.data?.selected_processes[0].process.id).toBe(3));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[1][0])).toContain("process=3");
  });
});
