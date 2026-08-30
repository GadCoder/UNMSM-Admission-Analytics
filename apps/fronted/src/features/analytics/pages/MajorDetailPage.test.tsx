import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../api/analytics";
import type { MajorDetail, MajorDetailProcess } from "../api/analytics.types";
import { MajorDetailPage } from "./MajorDetailPage";

vi.mock("../api/analytics", async (importOriginal) => ({
  ...await importOriginal<typeof import("../api/analytics")>(),
  usePublishedProcesses: vi.fn(),
  useMajorDetail: vi.fn(),
}));

const processes = [
  { id: 2, year: 2026, sequence: "26-1", name: "" },
  { id: 1, year: 2025, sequence: "25-2", name: "" },
];

const detailProcess = (process: typeof processes[number], total: number): MajorDetailProcess => ({
  process,
  total_results: total,
  admitted_count: 10,
  absent_count: 2,
  average_score: "70.0000",
  highest_score: "95.0000",
});

const detail: MajorDetail = {
  major: { id: 42, code: "015", name: "Ingeniería de Sistemas", faculty: "Facultad", academic_area: "Ingenierías" },
  selected_processes: [detailProcess(processes[0], 100)],
  history: [detailProcess(processes[1], 80)],
};

function renderPage(entry = "/analytics/careers/42") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes><Route path="/analytics/careers/:majorId" element={<MajorDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MajorDetailPage", () => {
  beforeEach(() => {
    cleanup();
    vi.mocked(api.usePublishedProcesses).mockReturnValue({
      data: processes,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    vi.mocked(api.useMajorDetail).mockReturnValue({
      data: detail,
      isPending: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useMajorDetail>);
  });

  it("uses the latest published process when the URL omits process", () => {
    renderPage();

    expect(vi.mocked(api.useMajorDetail)).toHaveBeenLastCalledWith("42", "2", []);
    expect(screen.getByRole("heading", { name: "Ingeniería de Sistemas" })).toBeInTheDocument();
  });

  it("keeps the detail visible and announces a refresh while fetching", () => {
    vi.mocked(api.useMajorDetail).mockReturnValue({
      data: detail,
      isPending: false,
      isFetching: true,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useMajorDetail>);

    renderPage("/analytics/careers/42?process=2&compare=1");

    expect(screen.getByRole("status")).toHaveTextContent("Actualizando detalle");
    expect(screen.getByRole("region", { name: "Detalle de la carrera" })).toHaveAttribute("aria-busy", "true");
  });

  it("renders history in chronological order independent of selected process order", () => {
    renderPage("/analytics/careers/42?process=2");

    const history = screen.getByRole("region", { name: "Evolución de la carrera" });
    const text = history.textContent ?? "";
    expect(text.indexOf("2025-2")).toBeLessThan(text.indexOf("2026-1"));
  });

  it("renders history as a labeled data table", () => {
    renderPage("/analytics/careers/42?process=2");

    const table = screen.getByRole("table", { name: "Historial de resultados por proceso" });
    expect(table).toHaveTextContent("Postulantes");
    expect(table).toHaveTextContent("Tasa de ingreso");
    expect(table).toHaveTextContent("Puntaje promedio");
    expect(table).toHaveTextContent("2025-2");
  });
});
