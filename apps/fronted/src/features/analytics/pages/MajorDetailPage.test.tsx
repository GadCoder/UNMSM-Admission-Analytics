import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../api/analytics";
import type { MajorDetail, MajorDetailProcess } from "../api/analytics.types";
import { MajorDetailPage } from "./MajorDetailPage";

vi.mock("../api/analytics", async (importOriginal) => ({
  ...await importOriginal<typeof import("../api/analytics")>(),
  usePublishedProcesses: vi.fn(),
  useMajorDetail: vi.fn(),
  useModalities: vi.fn(),
}));

const defaultModality = "EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)";

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
  average_score: "85.0000",
  highest_score: "95.0000",
  minimum_admitted_score: 80.1234,
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
    vi.mocked(api.useModalities).mockReturnValue({ data: [{ id: 1, name: "Ordinario" }, { id: 2, name: defaultModality }] } as ReturnType<typeof api.useModalities>);
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

  it("uses the latest published process and EBR/EBA before the first statistics request", () => {
    vi.mocked(api.useMajorDetail).mockClear();
    renderPage();

    expect(vi.mocked(api.useMajorDetail)).toHaveBeenLastCalledWith("42", "2", [], defaultModality);
    expect(vi.mocked(api.useMajorDetail).mock.calls.every((call) => call[3] === defaultModality)).toBe(true);
    expect(screen.getByLabelText("Modalidad")).toHaveValue(defaultModality);
    expect(screen.queryByRole("option", { name: "Todas las modalidades" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ingeniería de Sistemas" })).toBeInTheDocument();
  });

  it("keeps a single process selector while showing the full career history immediately", () => {
    renderPage("/analytics/careers/42?process=2");

    const firstKpi = screen.getAllByText("100", { selector: "strong" })[0].closest("article");
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("2");
    expect(screen.getByRole("link", { name: "← Volver a la vista de proceso" })).toHaveAttribute("href", "/?process=2");
    expect(screen.queryByText("Detalle de carrera")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resultados históricos" })).toBeInTheDocument();
    const historyChart = screen.getByRole("region", { name: "Evolución histórica de la carrera" });
    expect(within(historyChart).getByLabelText("Métrica")).toHaveValue("total_results");
    expect(within(historyChart).getByRole("img", { name: "Postulantes por proceso" })).toBeInTheDocument();
    expect(within(historyChart).getByRole("button", { name: /2025-2: 80[.]/ })).toBeInTheDocument();
    expect(within(historyChart).getByRole("button", { name: /2026-1: 100[.]/ })).toBeInTheDocument();
    expect(screen.queryByText("Historial completo")).not.toBeInTheDocument();
    expect(screen.queryByText("Resultados por proceso")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Añadir proceso para comparar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Comparación de procesos" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resultados históricos" }).compareDocumentPosition(firstKpi!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getByText("Variaciones respecto a 2025-2")).toBeInTheDocument();
    expect(screen.getByLabelText("Subió: +20 postulantes")).toBeInTheDocument();
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
    expect(screen.getByLabelText("Subió: +20 postulantes")).toBeInTheDocument();
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

  it("renders the newest historical process first while keeping calculations chronological", () => {
    renderPage("/analytics/careers/42?process=2");

    const history = screen.getByRole("list", { name: "Historial por proceso" });
    const text = history.textContent ?? "";
    expect(text.indexOf("2026-1")).toBeLessThan(text.indexOf("2025-2"));
  });

  it("renders historical results as insight-led timeline entries", () => {
    renderPage("/analytics/careers/42?process=2");

    const history = screen.getByRole("list", { name: "Historial por proceso" });
    expect(within(history).getByRole("heading", { name: "Hubo más postulantes que en 2025-2, con una cantidad similar de ingresantes." })).toBeInTheDocument();
    expect(history).toHaveTextContent("Ingresó el 10% de los postulantes, frente al 12.5% en 2025-2.");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows a reference summary for the oldest process", () => {
    renderPage("/analytics/careers/42?process=2");

    const oldest = screen.getByRole("article", { name: "Proceso 2025-2" });
    expect(oldest).toHaveTextContent("Referencia de participación e ingreso");
    expect(oldest).toHaveTextContent("80 postulantes · 10 ingresantes");
    expect(oldest).not.toHaveTextContent("frente al");
  });

  it("shows minimum, average and maximum scores in every career timeline entry", () => {
    renderPage("/analytics/careers/42?process=2");

    const history = screen.getByLabelText("Historial por proceso");
    expect(within(history).getByRole("button", { name: "2025-2" })).toBeInTheDocument();
    expect(within(history).getAllByText("Puntaje promedio")).toHaveLength(2);
    expect(within(history).getAllByText("Puntaje máximo")).toHaveLength(2);
    expect(within(history).getAllByText("Puntaje mínimo de ingreso")).toHaveLength(2);
    expect(within(history).queryByText("Ausentes")).not.toBeInTheDocument();
  });

  it("selects a process from history and updates the page URL-driven query", async () => {
    const user = userEvent.setup();
    renderPage("/analytics/careers/42?process=2");

    await user.click(screen.getAllByRole("button", { name: "2025-2" })[0]);

    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("1");
    expect(vi.mocked(api.useMajorDetail)).toHaveBeenLastCalledWith("42", "1", [], defaultModality);
  });

  it("ignores legacy comparison query state and fetches only the analyzed process", () => {
    renderPage("/analytics/careers/42?process=2&compare=1,3,4");

    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("2");
    expect(vi.mocked(api.useMajorDetail)).toHaveBeenLastCalledWith("42", "2", [], defaultModality);
    expect(screen.queryByRole("region", { name: "Comparación de procesos" })).not.toBeInTheDocument();
  });
  it("shows six career KPIs in order, one chart, and retains the modality filter", async () => {
    renderPage("/analytics/careers/42?process=2");
    const kpis = screen.getByLabelText("Indicadores de la carrera");
    expect(within(kpis).getAllByRole("article")).toHaveLength(6);
    expect([...kpis.querySelectorAll("article span")].filter((item) => item.className.includes("kpiLabel")).map((item) => item.textContent)).toEqual([
      "Postulantes", "Ingresantes", "Porcentaje de ingresantes", "Puntaje mínimo de ingreso", "Puntaje promedio*", "Puntaje máximo",
    ]);
    expect(within(kpis).queryByText("Postulantes ausentes")).not.toBeInTheDocument();
    expect(within(kpis).getByText("80.12")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Puntajes de ingreso" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /por proceso/ })).toHaveLength(1);
    await userEvent.selectOptions(screen.getByLabelText("Modalidad"), "Ordinario");
    expect(vi.mocked(api.useMajorDetail)).toHaveBeenLastCalledWith("42", "2", [], "Ordinario");
    await userEvent.selectOptions(screen.getByLabelText("Proceso analizado"), "1");
    expect(vi.mocked(api.useMajorDetail)).toHaveBeenLastCalledWith("42", "1", [], "Ordinario");
    expect(screen.getByLabelText("Modalidad")).toHaveValue("Ordinario");
  });

  it("defaults to minimum scores for the same identified modality and displays the full modality name", () => {
    const modality = "EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)";
    vi.mocked(api.useModalities).mockReturnValue({ data: [{ id: 1, name: modality }] } as ReturnType<typeof api.useModalities>);
    vi.mocked(api.useMajorDetail).mockReturnValue({
      data: { ...detail,
        selected_processes: [{ ...detail.selected_processes[0], admitted_score_modality_count: 1, admitted_score_modality: modality }],
        history: [{ ...detail.history[0], admitted_score_modality_count: 1, admitted_score_modality: modality }],
      }, isPending: false,
    } as ReturnType<typeof api.useMajorDetail>);
    renderPage(`/analytics/careers/42?process=2&modality=${encodeURIComponent(modality)}`);
    expect(screen.getByLabelText("Métrica")).toHaveValue("minimum_admitted_score");
    expect(screen.getByRole("option", { name: modality })).toHaveAttribute("title", modality);
    expect(screen.getByLabelText("Modalidad")).toHaveAttribute("title", modality);
  });

  it.each(["", "%20%20"])("resolves an empty modality to EBR/EBA without requesting combined statistics", (value) => {
    vi.mocked(api.useMajorDetail).mockClear();
    renderPage(`/analytics/careers/42?process=2&modality=${value}`);
    expect(screen.getByLabelText("Modalidad")).toHaveValue(defaultModality);
    expect(vi.mocked(api.useMajorDetail).mock.calls.every((call) => call[3] === defaultModality)).toBe(true);
  });

  it("uses existing loading and error states for score requests", () => {
    vi.mocked(api.useMajorDetail).mockReturnValue({ isPending: true } as ReturnType<typeof api.useMajorDetail>);
    const { unmount } = renderPage();
    expect(screen.getByRole("status")).toHaveAccessibleName("Cargando detalle de la carrera");
    unmount();
    vi.mocked(api.useMajorDetail).mockReturnValue({ isPending: false, isError: true } as ReturnType<typeof api.useMajorDetail>);
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el detalle");
  });

});
