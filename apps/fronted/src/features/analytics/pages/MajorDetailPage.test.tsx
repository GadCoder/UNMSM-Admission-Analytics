import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../api/analytics";
import type { MajorDetail, MajorDetailProcess } from "../api/analytics.types";
import { MajorDetailContent } from "./MajorDetailPage";

vi.mock("../api/analytics", async (importOriginal) => ({
  ...await importOriginal<typeof import("../api/analytics")>(),
  useMajorDetail: vi.fn(),
}));

const modality = "EBR/EBA";
const processes = [
  { id: 2, year: 2026, sequence: "26-1", name: "" },
  { id: 1, year: 2025, sequence: "25-2", name: "" },
  { id: 3, year: 2025, sequence: "25-1", name: "" },
];
const detailProcess = (process: typeof processes[number], total: number): MajorDetailProcess => ({
  process, total_results: total, admitted_count: 10, absent_count: 2,
  average_score: "85.0000", highest_score: "95.0000", minimum_admitted_score: 80.1234,
});
const detail: MajorDetail = {
  major: { id: 42, code: "015", name: "Ingeniería de Sistemas", faculty: "Facultad", academic_area: "Ingenierías" },
  selected_processes: [detailProcess(processes[0], 100)], history: [detailProcess(processes[1], 80)],
};

function renderContent(processId = "2", onSelectProcess = vi.fn(), focusHeading = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { onSelectProcess, ...render(<QueryClientProvider client={queryClient}>
    <MajorDetailContent majorId="42" processId={processId} modality={modality} onSelectProcess={onSelectProcess} focusHeading={focusHeading} />
  </QueryClientProvider>) };
}

describe("MajorDetailContent", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(api.useMajorDetail).mockReturnValue({ data: detail, isPending: false, isFetching: false, isError: false, isSuccess: true, refetch: vi.fn() } as unknown as ReturnType<typeof api.useMajorDetail>);
  });

  it("fetches the requested career, process, and modality", () => {
    renderContent();
    expect(api.useMajorDetail).toHaveBeenCalledWith("42", "2", [], modality);
    expect(screen.getByRole("heading", { name: "Ingeniería de Sistemas" })).toBeInTheDocument();
    expect(screen.getByText("Facultad · Ingenierías")).toBeInTheDocument();
  });

  it("focuses the career heading when requested", () => {
    renderContent("2", vi.fn(), true);
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Ingeniería de Sistemas" }));
  });

  it("renders career KPIs, chronological chart, and historical results", () => {
    renderContent();
    expect(within(screen.getByLabelText("Indicadores de la carrera")).getAllByRole("article")).toHaveLength(6);
    const chart = screen.getByRole("region", { name: "Evolución histórica de la carrera" });
    expect(within(chart).getByRole("img", { name: "Postulantes por proceso" })).toBeInTheDocument();
    expect(within(chart).getByRole("button", { name: /2025-2: 80/ })).toBeInTheDocument();
    const history = screen.getByRole("list", { name: "Historial por proceso" });
    expect(history.textContent!.indexOf("2026-1")).toBeLessThan(history.textContent!.indexOf("2025-2"));
    expect(screen.getByRole("heading", { name: "Resultados históricos" })).toBeInTheDocument();
    expect(screen.getByText("Variaciones respecto a 2025-2")).toBeInTheDocument();
    expect(screen.getByLabelText("Subió: +20 postulantes")).toBeInTheDocument();
  });

  it("uses sequence suffixes to find the immediately preceding cycle", () => {
    const next = { id: 6, year: 2026, sequence: "26-2", name: "" };
    vi.mocked(api.useMajorDetail).mockReturnValue({
      data: { ...detail, selected_processes: [detailProcess(next, 120), detailProcess(processes[0], 100)], history: [detailProcess(processes[1], 80)] },
      isPending: false, isFetching: false, isError: false,
    } as unknown as ReturnType<typeof api.useMajorDetail>);
    renderContent("6");
    expect(screen.getByText("Variaciones respecto a 2026-1")).toBeInTheDocument();
    expect(screen.getByLabelText("Subió: +20 postulantes")).toBeInTheDocument();
  });

  it("defaults to minimum score when the selected process has a valid minimum", () => {
    const identified = (item: MajorDetailProcess): MajorDetailProcess => ({ ...item, admitted_score_modality_count: 1, admitted_score_modality: modality });
    vi.mocked(api.useMajorDetail).mockReturnValue({
      data: { ...detail, selected_processes: [identified(detail.selected_processes[0])], history: [identified(detail.history[0])]},
      isPending: false, isFetching: false, isError: false,
    } as unknown as ReturnType<typeof api.useMajorDetail>);
    renderContent();
    expect(screen.getByLabelText("Métrica")).toHaveValue("minimum_admitted_score");
  });

  it("shows the selected minimum even when its modality is unknown", () => {
    renderContent();
    expect(screen.getByLabelText("Métrica")).toHaveValue("minimum_admitted_score");
  });

  it("notifies the parent when a process is selected from history", () => {
    const onSelectProcess = vi.fn();
    renderContent("2", onSelectProcess);
    fireEvent.click(screen.getAllByRole("button", { name: "2025-2" })[0]);
    expect(onSelectProcess).toHaveBeenCalledWith(1);
  });

  it("keeps career history and reports no results when the selected process is absent", () => {
    vi.mocked(api.useMajorDetail).mockReturnValue({
      data: { ...detail, selected_processes: [], history: [detail.history[0]] }, isPending: false, isFetching: false, isError: false,
    } as unknown as ReturnType<typeof api.useMajorDetail>);
    renderContent("99");
    expect(screen.getByRole("heading", { name: "Ingeniería de Sistemas" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No hay resultados de esta carrera para el proceso y la modalidad seleccionados.");
    expect(screen.getByRole("list", { name: "Historial por proceso" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Indicadores de la carrera")).not.toBeInTheDocument();
  });

  it("does not leave a disabled query in an endless loading state when process is missing", () => {
    vi.mocked(api.useMajorDetail).mockReturnValue({ data: undefined, isPending: true, isFetching: false, isError: false } as unknown as ReturnType<typeof api.useMajorDetail>);
    renderContent("");
    expect(screen.queryByRole("status", { name: "Cargando detalle de la carrera" })).not.toBeInTheDocument();
    expect(screen.getByText(/Selecciona un proceso y una modalidad/)).toBeInTheDocument();
  });

  it("shows loading skeleton while a request is pending", () => {
    vi.mocked(api.useMajorDetail).mockReturnValue({ isPending: true, isError: false } as ReturnType<typeof api.useMajorDetail>);
    renderContent();
    expect(screen.getByRole("status")).toHaveAccessibleName("Cargando detalle de la carrera");
  });

  it("shows query failures with a retry action", () => {
    const refetch = vi.fn();
    vi.mocked(api.useMajorDetail).mockReturnValue({ isPending: false, isError: true, data: undefined, refetch } as unknown as ReturnType<typeof api.useMajorDetail>);
    renderContent();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el detalle");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("announces a failed refresh and offers retry while retaining cached career data", () => {
    const refetch = vi.fn();
    vi.mocked(api.useMajorDetail).mockReturnValue({ data: detail, isPending: false, isFetching: false, isError: true, refetch } as unknown as ReturnType<typeof api.useMajorDetail>);
    renderContent();
    expect(screen.getByRole("heading", { name: "Ingeniería de Sistemas" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos actualizar el detalle");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("does not describe placeholder history as a confirmed no-results outcome", () => {
    vi.mocked(api.useMajorDetail).mockReturnValue({ data: detail, isPending: false, isFetching: true, isError: false, isPlaceholderData: true } as unknown as ReturnType<typeof api.useMajorDetail>);
    renderContent("99");
    expect(screen.getByText("Consultando resultados del proceso y la modalidad seleccionados…")).toBeInTheDocument();
    expect(screen.queryByText("No hay resultados de esta carrera")).not.toBeInTheDocument();
  });

  it("renders historical entries as insight-led content with score details", () => {
    renderContent();
    const history = screen.getByRole("list", { name: "Historial por proceso" });
    expect(within(history).getByRole("heading", { name: "Hubo más postulantes que en 2025-2, con una cantidad similar de ingresantes." })).toBeInTheDocument();
    expect(history).toHaveTextContent("Ingresó el 10% de los postulantes, frente al 12.5% en 2025-2.");
    expect(within(history).getAllByText("Puntaje promedio")).toHaveLength(2);
    expect(within(history).getAllByText("Puntaje máximo")).toHaveLength(2);
    expect(within(history).getAllByText("Puntaje mínimo de ingreso")).toHaveLength(2);
  });
});
