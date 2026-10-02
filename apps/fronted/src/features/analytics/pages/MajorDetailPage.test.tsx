import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
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
  { id: 3, year: 2025, sequence: "25-1", name: "" },
  { id: 4, year: 2024, sequence: "24-2", name: "" },
  { id: 5, year: 2024, sequence: "24-1", name: "" },
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
    sessionStorage.clear();
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

  it("keeps a single process selector while showing the full career history immediately", () => {
    renderPage("/analytics/careers/42?process=2");

    const firstKpi = screen.getByText("100", { selector: "strong" }).closest("article");
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("2");
    expect(screen.getByRole("link", { name: "← Volver a la vista de proceso" })).toHaveAttribute("href", "/?process=2");
    expect(screen.queryByText("Detalle de carrera")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resultados históricos" })).toBeInTheDocument();
    expect(screen.queryByText("Historial completo")).not.toBeInTheDocument();
    expect(screen.queryByText("Resultados por proceso")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Añadir proceso para comparar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Comparación de procesos" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resultados históricos" }).compareDocumentPosition(firstKpi!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getByText("Variaciones respecto a 2025-2")).toBeInTheDocument();
    expect(screen.getByLabelText("Subió: +20")).toBeInTheDocument();
  });

  it("finds the immediately preceding cycle from API sequence suffixes such as 26-2 and 26-1", () => {
    const nextCycle = { id: 6, year: 2026, sequence: "26-2", name: "" };
    vi.mocked(api.usePublishedProcesses).mockReturnValue({
      data: [nextCycle, ...processes],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    vi.mocked(api.useMajorDetail).mockReturnValue({
      data: {
        ...detail,
        selected_processes: [detailProcess(nextCycle, 120), detailProcess(processes[0], 100)],
        history: [detailProcess(processes[1], 80)],
      },
      isPending: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useMajorDetail>);

    renderPage("/analytics/careers/42?process=6&compare=2");

    expect(screen.getByText("Variaciones respecto a 2026-1")).toBeInTheDocument();
    expect(screen.getByLabelText("Subió: +20")).toBeInTheDocument();
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

    const history = screen.getByRole("table", { name: "Historial de resultados por proceso" });
    const text = history.textContent ?? "";
    expect(text.indexOf("2025-2")).toBeLessThan(text.indexOf("2026-1"));
  });

  it("renders history as a labeled data table", () => {
    renderPage("/analytics/careers/42?process=2");

    const table = screen.getByRole("table", { name: "Historial de resultados por proceso" });
    expect(table).toHaveTextContent("Postulantes");
    expect(screen.queryByRole("columnheader", { name: "Demanda" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Ingreso" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Puntajes" })).not.toBeInTheDocument();
    expect(table).toHaveTextContent("Tasa de ingreso");
    expect(table).toHaveTextContent("Ausentes");
    expect(table).toHaveTextContent("% ausentes");
    expect(table).toHaveTextContent("Puntaje máximo");
    expect(table).toHaveTextContent("Puntaje promedio");
    expect(table).toHaveTextContent("2025-2");
  });

  it("surfaces concise historical highlights without making the mobile cards a comparison view", () => {
    renderPage("/analytics/careers/42?process=2");

    const highlights = screen.getByRole("list", { name: "Puntos clave del historial" });
    expect(within(highlights).getAllByRole("listitem")).toHaveLength(3);
    expect(within(highlights).getByText("Mayor demanda")).toBeInTheDocument();
    expect(within(highlights).getByText("100 postulantes")).toBeInTheDocument();
    expect(within(highlights).getByText("Mayor tasa de ingreso")).toBeInTheDocument();
    expect(within(highlights).getByText("12.5%")).toBeInTheDocument();
    expect(within(highlights).getByText("Mayor puntaje promedio")).toBeInTheDocument();
  });

  it("renders mobile history cards for every chronological process", () => {
    renderPage("/analytics/careers/42?process=2");

    const history = screen.getByRole("list", { name: "Historial por proceso" });
    expect(within(history).getAllByRole("listitem")).toHaveLength(2);
    expect(within(history).queryByRole("group", { name: "Postulantes en 2025-2" })).not.toBeInTheDocument();
    expect(within(history).getByRole("heading", { name: "2025-2" })).toBeInTheDocument();
    expect(within(history).getAllByText("Postulantes")).toHaveLength(2);
    expect(within(history).getAllByText("Postulantes ausentes")).toHaveLength(2);
    expect(within(history).getAllByText("Puntaje máximo")).toHaveLength(2);
    expect(within(history).getAllByText("Puntaje promedio")).toHaveLength(2);
  });

  it("ignores legacy comparison query state and fetches only the analyzed process", () => {
    renderPage("/analytics/careers/42?process=2&compare=1,3,4");

    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("2");
    expect(vi.mocked(api.useMajorDetail)).toHaveBeenLastCalledWith("42", "2", []);
    expect(screen.queryByRole("region", { name: "Comparación de procesos" })).not.toBeInTheDocument();
  });
});
