import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  useAcademicAreas,
  useAnalyticsOverview,
  useFaculties,
  useMajorCatalog,
  useMajorDetail,
  useModalities,
  useProcessHistory,
  usePublishedProcesses,
} from "./analytics";

const process = { id: 2, year: 2026, sequence: "26-2", name: "Latest" };
const previous = { id: 1, year: 2026, sequence: "26-1", name: "Previous" };
const metrics = {
  process,
  total_results: 300,
  admitted_count: 10,
  absent_count: 0,
  average_score: "700",
  highest_score: "800",
};
const detail = {
  major: {
    id: 42,
    code: "42",
    name: "Medicine",
    faculty: "Faculty",
    academic_area: "Area",
    is_new: false,
  },
  selected_processes: [metrics],
  history: [{ ...metrics, process: previous }],
};
type PendingRequest = { url: string; signal: AbortSignal; resolve: (body: unknown) => void };
const clients: QueryClient[] = [];

function setup(seedProcesses = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 3, staleTime: 60_000 } },
  });
  clients.push(client);
  if (seedProcesses) client.setQueryData(["published-processes"], [process, previous]);
  const requests: PendingRequest[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const signal = init?.signal;
    if (!signal) throw new Error("Query did not forward its AbortSignal to fetch");
    return new Promise<Response>((resolve, reject) => {
      const abort = () => reject(new DOMException("Aborted", "AbortError"));
      if (signal.aborted) return abort();
      signal.addEventListener("abort", abort, { once: true });
      requests.push({
        url: String(input),
        signal,
        resolve: (body) => {
          signal.removeEventListener("abort", abort);
          resolve(new Response(JSON.stringify(body)));
        },
      });
    });
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, requests, wrapper };
}

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
});

describe("query cancellation", () => {
  it("aborts superseded overview/history requests and displays only the final filters", async () => {
    const { client, requests, wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ faculty }) => ({
        overview: useAnalyticsOverview("2", [], { faculty }),
        history: useProcessHistory({ faculty }),
      }),
      { wrapper, initialProps: { faculty: "A" } },
    );
    await waitFor(() => expect(requests).toHaveLength(2));
    rerender({ faculty: "B" });
    await waitFor(() => expect(requests).toHaveLength(4));
    rerender({ faculty: "C" });
    await waitFor(() => expect(requests).toHaveLength(6));
    expect(requests.slice(0, 4).every(({ signal }) => signal.aborted)).toBe(true);
    expect(requests.slice(4).every(({ signal }) => !signal.aborted)).toBe(true);
    await act(async () => {
      requests
        .slice(0, 4)
        .forEach((request) => request.resolve({ processes: [{ ...metrics, total_results: 100 }] }));
    });
    expect(result.current.overview.data).toBeUndefined();
    expect(result.current.history.data).toBeUndefined();
    await act(async () => {
      requests
        .slice(4)
        .forEach((request) => request.resolve({ processes: [{ ...metrics, majors: [] }] }));
    });
    await waitFor(() =>
      expect(result.current.overview.isSuccess && result.current.history.isSuccess).toBe(true),
    );
    expect(result.current.overview.data?.processes[0].total_results).toBe(300);
    expect(result.current.history.data?.processes[0].total_results).toBe(300);
    for (const faculty of ["A", "B"]) {
      for (const key of [
        ["analytics-overview", "2", [], { faculty }],
        ["analytics-history", { faculty }],
      ]) {
        const state = client.getQueryState(key);
        expect(state?.error).toBeNull();
        expect(state?.data).toBeUndefined();
        expect(state?.fetchFailureCount).toBe(0);
      }
    }
    expect(requests).toHaveLength(6);
  });

  it("aborts the old career modality while preserving in-flight period reuse", async () => {
    const { requests, wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ primary, modality }) => useMajorDetail("42", primary, [], modality),
      { wrapper, initialProps: { primary: "2", modality: "EBR" } },
    );
    await waitFor(() => expect(requests).toHaveLength(1));
    rerender({ primary: "1", modality: "EBR" });
    expect(requests).toHaveLength(1);
    expect(requests[0].signal.aborted).toBe(false);
    rerender({ primary: "1", modality: "Special" });
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[0].signal.aborted).toBe(true);
    expect(requests[1].signal.aborted).toBe(false);
    expect(requests[1].url).toContain("modality=Special");
    await act(async () => requests[1].resolve(detail));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.selected_processes[0].process.id).toBe(1);
    expect(result.current.isError).toBe(false);
  });

  it("keeps a shared request alive until its last observer leaves and restarts cleanly", async () => {
    const { requests, wrapper } = setup();
    const first = renderHook(() => useMajorDetail("42", "2", [], "EBR"), { wrapper });
    const second = renderHook(() => useMajorDetail("42", "1", [], "EBR"), { wrapper });
    await waitFor(() => expect(requests).toHaveLength(1));
    first.unmount();
    expect(requests[0].signal.aborted).toBe(false);
    second.unmount();
    expect(requests[0].signal.aborted).toBe(true);
    const third = renderHook(() => useMajorDetail("42", "2", [], "EBR"), { wrapper });
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1].signal.aborted).toBe(false);
    await act(async () => requests[1].resolve(detail));
    await waitFor(() => expect(third.result.current.isSuccess).toBe(true));
  });

  it("cancels all unused catalog requests on unmount", async () => {
    const { requests, wrapper } = setup(false);
    const { unmount } = renderHook(
      () => {
        usePublishedProcesses();
        useAcademicAreas();
        useFaculties();
        useModalities();
        useMajorCatalog();
      },
      { wrapper },
    );
    await waitFor(() => expect(requests).toHaveLength(5));
    expect(requests.every(({ signal }) => !signal.aborted)).toBe(true);
    unmount();
    expect(requests.every(({ signal }) => signal.aborted)).toBe(true);
  });
});
