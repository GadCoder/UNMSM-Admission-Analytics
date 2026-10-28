import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useCareerView, useSearchUsage } from "./hooks";
import { trackUsage } from "./usage";
vi.mock("./usage", () => ({ trackUsage: vi.fn() }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(trackUsage).mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("waits for ready career data and ignores refetch rerenders", () => {
  const { rerender } = renderHook(
    ({ ready, process }) => useCareerView("11", process, "EBR", ready),
    { initialProps: { ready: false, process: "2" } },
  );
  expect(trackUsage).not.toHaveBeenCalled();
  rerender({ ready: true, process: "2" });
  rerender({ ready: false, process: "2" });
  rerender({ ready: true, process: "2" });
  expect(trackUsage).toHaveBeenCalledTimes(1);
  rerender({ ready: true, process: "1" });
  expect(trackUsage).toHaveBeenCalledTimes(2);
});
it("debounces search edits, reports empty results, and omits search text", () => {
  const { rerender } = renderHook(
    ({ query, count }) => useSearchUsage(query, count, true, "careers"),
    { initialProps: { query: "med", count: 2 } },
  );
  act(() => {
    vi.advanceTimersByTime(400);
  });
  rerender({ query: "medicina privada", count: 0 });
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(trackUsage).toHaveBeenNthCalledWith(1, "search_completed", {
    page: "careers",
    result_count: "0",
  });
  expect(trackUsage).toHaveBeenNthCalledWith(2, "results_empty", { page: "careers" });
  rerender({ query: "medicina privada", count: 0 });
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(trackUsage).toHaveBeenCalledTimes(2);
});
it("cancels pending search events on unmount", () => {
  const { unmount } = renderHook(() => useSearchUsage("med", 2, true, "careers"));
  unmount();
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(trackUsage).not.toHaveBeenCalled();
});
