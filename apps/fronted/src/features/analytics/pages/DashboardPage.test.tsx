import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_ADMISSION_MODALITY } from "../utils/admissionModality";
import { DashboardPage } from "./DashboardPage";
import * as api from "../api/analytics";
import surfaceStyles from "../components/AnalyticsSurface.module.css";

vi.mock("../api/analytics", async (importOriginal) => ({
  ...await importOriginal<typeof import("../api/analytics")>(),
  usePublishedProcesses: vi.fn(),
  useAnalyticsOverview: vi.fn(),
  useProcessHistory: vi.fn(),
  useAcademicAreas: vi.fn(),
  useFaculties: vi.fn(),
  useModalities: vi.fn(),
}));

const processes = [
  { id: 1, year: 2025, sequence: "2", name: "Proceso 2025-II" },
  { id: 2, year: 2025, sequence: "1", name: "Proceso 2025-I" },
  { id: 3, year: 2024, sequence: "2", name: "Proceso 2024-II" },
  { id: 4, year: 2024, sequence: "1", name: "Proceso 2024-I" },
];
const academicAreas = [
  { id: 1, code: "SALUD", name: "Ciencias de la Salud" },
  { id: 2, code: "ING", name: "Ingenierías" },
];
const faculties = [
  { id: 1, code: "MED", name: "Medicina", academic_area_id: 1 },
  { id: 2, code: "SIS", name: "Ingeniería de Sistemas", academic_area_id: 2 },
];
const overview = { processes: [{ process: processes[0], total_results: 100, admitted_count: 20, absent_count: 10, average_score: "65.5", highest_score: "98.0", majors: [{ major_id: 1, major_code: "ING", major_name: "Ingeniería", total_results: 50, admitted_count: 12, absent_count: 5, average_score: "70" }] }] };
const comparisonOverview = { processes: [overview.processes[0], { process: processes[1], total_results: 80, admitted_count: 16, absent_count: 8, average_score: "62.5", highest_score: "95.0", majors: [{ major_id: 1, major_code: "ING", major_name: "Ingeniería", total_results: 40, admitted_count: 10, absent_count: 4, average_score: "68" }] }] };
const processHistory = { processes: [
  { process: processes[1], total_results: 80, admitted_count: 16, absent_count: 8, average_score: "62.5", highest_score: "95.0" },
  { process: processes[0], total_results: 100, admitted_count: 20, absent_count: 10, average_score: "65.5", highest_score: "98.0" },
] };
function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.search}</output><button type="button" onClick={() => navigate(-1)}>Atrás de prueba</button><button type="button" onClick={() => navigate(1)}>Adelante de prueba</button></>;
}
function renderPage(entry = "/") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[entry]}><DashboardPage /><LocationProbe /></MemoryRouter></QueryClientProvider>);
}

describe("DashboardPage", () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.mocked(api.usePublishedProcesses).mockReturnValue({ data: processes, isPending: false, isError: false } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    vi.mocked(api.useAcademicAreas).mockReturnValue({ data: academicAreas, isPending: false, isError: false } as unknown as ReturnType<typeof api.useAcademicAreas>);
    vi.mocked(api.useFaculties).mockReturnValue({ data: faculties, isPending: false, isError: false } as unknown as ReturnType<typeof api.useFaculties>);
    vi.mocked(api.useModalities).mockReturnValue({ data: [{ id: 1, name: DEFAULT_ADMISSION_MODALITY }, { id: 2, name: "Especial" }], isPending: false, isError: false } as unknown as ReturnType<typeof api.useModalities>);
    vi.mocked(api.useAnalyticsOverview).mockImplementation((primaryId) => ({
      data: { processes: [{ ...overview.processes[0], process: processes.find((item) => String(item.id) === primaryId) ?? { ...processes[0], id: Number(primaryId) } }] },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useAnalyticsOverview>));
    vi.mocked(api.useProcessHistory).mockReturnValue({
      data: processHistory,
      isPending: false,
      isFetching: false,
      isError: false,
    } as unknown as ReturnType<typeof api.useProcessHistory>);
  });
  it("defaults to latest process and renders KPIs", async () => {
    renderPage();
    expect(screen.getByText("Proceso", { selector: "label" })).toBeInTheDocument();
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("1");
    const history = screen.getByRole("region", { name: "Evolución histórica" });
    expect(history).toBeInTheDocument();
    expect(history).toHaveClass(surfaceStyles.surface);
    const metricSelect = screen.getByLabelText("Métrica");
    const sortSelect = screen.getByLabelText("Ordenar carreras");
    expect(metricSelect).toHaveValue("total_results");
    expect(metricSelect.className).not.toBe("");
    expect(metricSelect.className).toBe(sortSelect.className);
    const metricField = metricSelect.closest("label");
    const sortField = sortSelect.closest("label");
    expect(metricField?.className).not.toBe("");
    expect(metricField?.className).toBe(sortField?.className);
    expect(screen.queryByRole("heading", { name: "Resumen de 2025-2" })).not.toBeInTheDocument();
    expect(screen.queryByText("Proceso principal")).not.toBeInTheDocument();
    expect((await screen.findAllByText("100", { selector: "strong" })).length).toBeGreaterThan(0);
    expect(screen.getAllByText("65.5", { selector: "strong" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Postulantes").some((element) => element.closest("article") !== null)).toBe(true);
    expect(screen.getAllByText("Ingresantes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Porcentaje de ingresantes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Puntaje máximo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Puntaje promedio").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Postulantes ausentes").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Variaciones respecto a/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("article").filter((article) => !article.hasAttribute("aria-label")).map((article) => article.querySelector("span")?.textContent)).toEqual([
      "Postulantes",
      "Postulantes ausentes",
      "Ingresantes",
      "Porcentaje de ingresantes",
      "Puntaje máximo",
      "Puntaje promedio*",
    ]);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Vista comparativa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Comparación por procesos" })).not.toBeInTheDocument();
    expect(screen.getByText("50 postulantes · 12 admitidos")).toBeInTheDocument();
    const firstPerformanceCard = screen.getByTestId("major-performance-cards");
    const majorLink = within(firstPerformanceCard).getByRole("link", { name: "Ingeniería" });
    expect(majorLink).toHaveAttribute("href", `/analytics/careers/1?${new URLSearchParams({ process: "1", modality: DEFAULT_ADMISSION_MODALITY })}`);
    expect(within(firstPerformanceCard).queryByText("Ver más")).not.toBeInTheDocument();
    const metricsToggle = within(firstPerformanceCard).getByRole("button", { name: "Mostrar indicadores de Ingeniería" });
    expect(metricsToggle).toHaveAttribute("aria-expanded", "false");
    expect(metricsToggle.querySelector("svg")).toBeInTheDocument();
    expect(metricsToggle).not.toHaveTextContent("+");
    fireEvent.click(metricsToggle);
    expect(metricsToggle).toHaveAttribute("aria-expanded", "true");
    expect(within(firstPerformanceCard).getByText("Tasa de admisión")).toBeInTheDocument();
    const controlsSurface = screen.getByRole("region", { name: "Controles del análisis" });
    expect(controlsSurface).not.toHaveClass(surfaceStyles.surface);
    const careerFilters = within(controlsSurface).getByRole("group", { name: "Filtros de carreras" });
    const demandMap = screen.getByRole("region", { name: "Mapa de demanda y admisión" });
    const performance = screen.getByRole("region", { name: "Desempeño por carrera" });
    expect(demandMap).toHaveClass(surfaceStyles.surface);
    expect(performance).toHaveClass(surfaceStyles.surface);
    expect(within(careerFilters).queryByRole("heading", { name: "Filtros de carreras" })).not.toBeInTheDocument();
    expect(within(careerFilters).queryByText("Filtrar por área, facultad o modalidad")).not.toBeInTheDocument();
    expect(within(careerFilters).getByLabelText(/Abrir filtros de carreras/)).toBeInTheDocument();
    expect(within(careerFilters).getByLabelText(/Abrir filtros de carreras/)).toHaveTextContent("Filtros");
    expect(careerFilters.compareDocumentPosition(demandMap) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(demandMap.compareDocumentPosition(performance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(performance).not.toContainElement(careerFilters);
    expect(screen.getByRole("group", { name: "Mapa de postulantes y porcentaje de ingreso por carrera" })).toBeInTheDocument();
    const demandPoint = screen.getByRole("button", { name: "Mostrar datos de Ingeniería" });
    expect(screen.queryByText(/Carrera seleccionada:/)).not.toBeInTheDocument();
    fireEvent.click(demandPoint);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Ingeniería");
    expect(demandPoint).toHaveAttribute("aria-pressed", "true");
    for (const legendHeading of screen.getAllByRole("heading", { name: "Carreras representadas" })) {
      const legend = legendHeading.parentElement;
      expect(within(legend!).getByText("50 postulantes")).toBeInTheDocument();
      expect(within(legend!).getByText("24% ingresó")).toBeInTheDocument();
    }
    expect(screen.queryByRole("group", { name: /Ver carreras representadas/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ranking de postulantes" })).not.toBeInTheDocument();
  });
  it("groups compact controls before KPI cards without a bordered surface", async () => {
    renderPage();
    const toolbar = await screen.findByRole("region", { name: "Controles del análisis" });
    expect(toolbar).not.toHaveClass(surfaceStyles.surface);
    expect(within(toolbar).getByLabelText("Proceso analizado")).toHaveValue("1");
    expect(within(toolbar).queryByRole("button", { name: /comparar/i })).not.toBeInTheDocument();
    expect(within(toolbar).getByLabelText(/Abrir filtros de carreras/)).toBeInTheDocument();
    expect(within(toolbar).queryByRole("list", { name: "Filtros activos" })).not.toBeInTheDocument();
    expect(toolbar.compareDocumentPosition(screen.getAllByRole("article")[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("shows KPI trends against the previous process alongside the full timeline", async () => {
    vi.mocked(api.useAnalyticsOverview).mockReturnValue({
      data: {
        processes: [
          { ...overview.processes[0], absent_count: 6 },
          { ...overview.processes[0], process: processes[1], total_results: 80, admitted_count: 14, absent_count: 8, average_score: "62.5", highest_score: "95.0" },
        ],
      },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useAnalyticsOverview>);
    renderPage();
    expect(await screen.findByText("+20 postulantes", { selector: "small" })).toBeInTheDocument();
    expect(screen.getByText("Variaciones respecto a 2025-1")).toBeInTheDocument();
    expect(screen.getAllByText("Postulantes").find((element) => element.className.includes("kpiLabel"))).toBeInTheDocument();
    expect(screen.queryByText("+20 postulantes · vs 80 postulantes en 2025-1")).not.toBeInTheDocument();
    expect(screen.queryByText("vs 80 postulantes en 2025-1")).not.toBeInTheDocument();
    const currentValue = screen.getAllByText("100", { selector: "strong" })[0];
    const trendIndicator = screen.getByLabelText("Subió: +20 postulantes");
    const trendContext = screen.getByText("+20 postulantes", { selector: "small" });
    expect(trendIndicator.className).toContain("kpiTrendArrow");
    expect(currentValue.parentElement?.className).toContain("kpiValuePrimary");
    expect(trendIndicator.parentElement?.className).toContain("kpiTrendRail");
    expect(currentValue.parentElement?.parentElement).toBe(trendIndicator.parentElement?.parentElement);
    expect(trendContext.parentElement).toBe(trendIndicator.parentElement);
    expect(screen.getByLabelText("Subió: +2.5 pp")).toBeInTheDocument();
    expect(screen.getByLabelText("Bajó: -2 ausentes")).toBeInTheDocument();
    expect(screen.getByLabelText("Subió: +6 ingresantes")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/pts$/)).toHaveLength(2);
    expect(screen.getByText("-2 ausentes", { selector: "small" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Vista comparativa" })).not.toBeInTheDocument();
  });

  it("keeps the initial URL limited to the primary process", async () => {
    renderPage();
    await screen.findByRole("table");
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("process=1"));
    expect(screen.getByTestId("location")).not.toHaveTextContent("compare=");
    expect(sessionStorage.getItem("unmsm-dashboard-view") ?? "").not.toContain('"comparisons":["');
  });
  it("updates the analyzed process when its select changes", async () => {
    renderPage();
    await screen.findByRole("table");
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("process=1"));
    fireEvent.change(screen.getByLabelText("Proceso analizado"), { target: { value: "2" } });
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("2");
    const timeline = screen.getByRole("region", { name: "Resultados históricos" });
    expect(within(timeline).getByRole("button", { name: "2025-1" })).toHaveAttribute("aria-pressed", "true");
  });
  it("keeps the primary selector and analytics aligned with browser back and forward", async () => {
    const user = userEvent.setup();
    renderPage("/?process=1");
    await user.selectOptions(screen.getByLabelText("Proceso analizado"), "2");
    await user.click(screen.getByRole("button", { name: "Atrás de prueba" }));
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("1");
    expect(api.useAnalyticsOverview).toHaveBeenLastCalledWith("1", ["2"], { academicArea: "", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
    await user.click(screen.getByRole("button", { name: "Adelante de prueba" }));
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("2");
  });
  it("shows the latest three processes and expands older entries without comparison controls", async () => {
    const user = userEvent.setup();
    const allProcesses = [...processes,
      { id: 5, year: 2023, sequence: "2", name: "" },
      { id: 6, year: 2023, sequence: "1", name: "" },
    ];
    vi.mocked(api.usePublishedProcesses).mockReturnValue({ data: allProcesses, isPending: false, isError: false } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    vi.mocked(api.useProcessHistory).mockReturnValue({
      data: { processes: [
        ...processHistory.processes,
        ...allProcesses.slice(2).reverse().map((process) => ({ ...processHistory.processes[0], process })),
      ] },
      isPending: false, isFetching: false, isError: false,
    } as unknown as ReturnType<typeof api.useProcessHistory>);
    renderPage("/?process=1");
    const timeline = screen.getByRole("region", { name: "Resultados históricos" });
    expect(within(timeline).getAllByRole("article")).toHaveLength(3);
    expect(within(timeline).queryByRole("button", { name: "2023-1" })).not.toBeInTheDocument();
    await user.click(within(timeline).getByRole("button", { name: "Ver más" }));
    expect(within(timeline).getAllByRole("article")).toHaveLength(6);
    expect(within(timeline).getAllByRole("article").map((article) => within(article).getByRole("button", { name: /^\d{4}-/ }).textContent)).toEqual(["2025-2", "2025-1", "2024-2", "2024-1", "2023-2", "2023-1"]);
    await user.click(within(timeline).getByRole("button", { name: "Ver menos" }));
    expect(within(timeline).getAllByRole("article")).toHaveLength(3);
    await user.selectOptions(screen.getByLabelText("Proceso analizado"), "6");
    expect(within(timeline).getAllByRole("article")).toHaveLength(6);
    expect(within(timeline).getByRole("button", { name: "2023-1" })).toHaveAttribute("aria-pressed", "true");
    expect(within(timeline).getByRole("button", { name: "2025-2" })).toHaveAttribute("aria-pressed", "false");
    expect(within(screen.getByRole("region", { name: "Controles del análisis" })).queryByRole("button", { name: /comparar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Procesos en comparación" })).not.toBeInTheDocument();
  });

  it("shows history even when only one process is published", () => {
    vi.mocked(api.usePublishedProcesses).mockReturnValue({ data: [processes[0]], isPending: false, isError: false } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    vi.mocked(api.useProcessHistory).mockReturnValue({ data: { processes: [overview.processes[0]] }, isFetching: false, isError: false } as unknown as ReturnType<typeof api.useProcessHistory>);
    renderPage("/?process=1");
    const timeline = screen.getByRole("region", { name: "Resultados históricos" });
    expect(within(timeline).getAllByRole("article")).toHaveLength(1);
    expect(within(timeline).getByRole("button", { name: "2025-2" })).toHaveAttribute("aria-pressed", "true");
    expect(api.useAnalyticsOverview).toHaveBeenLastCalledWith("1", [], { academicArea: "", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
  });

  it("updates KPIs and the history highlight without removing any history entries", async () => {
    const user = userEvent.setup();
    vi.mocked(api.useAnalyticsOverview).mockImplementation((primaryId) => ({
      data: { processes: [comparisonOverview.processes.find((item) => String(item.process.id) === primaryId)!] },
      isPending: false, isError: false, isSuccess: true,
    } as unknown as ReturnType<typeof api.useAnalyticsOverview>));
    renderPage("/?process=1");
    const timeline = screen.getByRole("region", { name: "Resultados históricos" });
    const applicants = within(screen.getByLabelText("Indicadores del proceso")).getByText("Postulantes", { selector: "span" }).closest("article")!;
    expect(applicants).toHaveTextContent("100");
    await user.selectOptions(screen.getByLabelText("Proceso analizado"), "2");
    expect(applicants).toHaveTextContent("80");
    expect(within(timeline).getByRole("button", { name: "2025-1" })).toHaveAttribute("aria-pressed", "true");
    expect(within(timeline).getByRole("button", { name: "2025-2" })).toHaveAttribute("aria-pressed", "false");
    expect(within(timeline).getAllByRole("article")).toHaveLength(2);
    expect(api.useAnalyticsOverview).toHaveBeenLastCalledWith("2", ["3"], { academicArea: "", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
  });

  it("selects a historical process and synchronizes the selector and URL", async () => {
    const user = userEvent.setup();
    renderPage("/?process=1");
    const timeline = screen.getByRole("region", { name: "Resultados históricos" });
    await user.click(within(timeline).getByRole("button", { name: "2025-1" }));
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("2");
    expect(screen.getByTestId("location")).toHaveTextContent("?process=2");
    expect(within(timeline).getByRole("button", { name: "2025-1" })).toHaveAttribute("aria-pressed", "true");
  });

  it.each([
    ["loading", "Cargando resultados históricos…"],
    ["error", "No pudimos cargar los resultados históricos."],
    ["empty", "Aún no hay resultados históricos disponibles."],
  ])("keeps the history section visible in its %s state", (state, message) => {
    vi.mocked(api.useProcessHistory).mockReturnValue({
      data: state === "empty" ? { processes: [] } : undefined,
      isPending: state === "loading", isFetching: state === "loading", isError: state === "error",
    } as unknown as ReturnType<typeof api.useProcessHistory>);
    renderPage("/?process=1");
    expect(within(screen.getByRole("region", { name: "Resultados históricos" })).getByText(message)).toBeInTheDocument();
  });

  it("filters faculty options by the selected academic area", async () => {
    const user = userEvent.setup();
    renderPage("/?academic_area=SALUD");

    const careerFilters = within(screen.getByRole("region", { name: "Controles del análisis" })).getByRole("group", { name: "Filtros de carreras" });
    expect(within(careerFilters).getByLabelText(/Abrir filtros de carreras/)).toHaveTextContent("Filtros");
    expect(within(careerFilters).getByLabelText("Abrir filtros de carreras, 1 filtro activo")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Selección de procesos y filtros" })).not.toBeInTheDocument();
    await user.click(within(careerFilters).getByLabelText(/Abrir filtros de carreras/));
    const faculty = await screen.findByLabelText("Facultad");
    expect(within(faculty).getByRole("option", { name: "Medicina" })).toBeInTheDocument();
    expect(within(faculty).queryByRole("option", { name: "Ingeniería de Sistemas" })).not.toBeInTheDocument();
  });

  it("closes the filters panel when clicking outside it", async () => {
    const user = userEvent.setup();
    renderPage();

    const careerFilters = within(screen.getByRole("region", { name: "Controles del análisis" })).getByRole("group", { name: "Filtros de carreras" });
    await user.click(within(careerFilters).getByLabelText(/Abrir filtros de carreras/));
    expect(screen.getByLabelText("Facultad")).toBeVisible();

    await user.click(document.body);
    await waitFor(() => expect(screen.queryByLabelText("Facultad")).not.toBeInTheDocument());
  });

  it("debounces filter changes before updating the URL", async () => {
    const user = userEvent.setup();
    renderPage();

    const careerFilters = within(screen.getByRole("region", { name: "Controles del análisis" })).getByRole("group", { name: "Filtros de carreras" });
    await user.click(within(careerFilters).getByLabelText(/Abrir filtros de carreras/));
    await user.selectOptions(screen.getByLabelText("Área académica"), "ING");

    expect(screen.getByTestId("location")).toHaveTextContent("process=1");
    expect(screen.queryByRole("heading", { name: "Resumen de 2025-2" })).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).not.toHaveTextContent("academic_area=ING");

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("process=1"), { timeout: 1000 });
    await waitFor(() => expect(sessionStorage.getItem("unmsm-dashboard-view")).toContain('"academicArea":"ING"'));
  });

  it("removes an area chip with its dependent faculty", async () => {
    const user = userEvent.setup();
    renderPage("/?process=1&compare=3&academic_area=ING&faculty=SIS");
    await user.click(await screen.findByRole("button", { name: "Quitar filtro Área académica: Ingenierías" }));
    await waitFor(() => {
      const saved = JSON.parse(sessionStorage.getItem("unmsm-dashboard-view")!);
      expect(saved.filters).toEqual({ academicArea: "", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
      expect(saved.comparisons).toBeUndefined();
    });
    expect(screen.queryByRole("list", { name: "Filtros activos" })).not.toBeInTheDocument();
    expect(api.useProcessHistory).toHaveBeenLastCalledWith({ academicArea: "", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
  });

  it("resets filters without restoring a pending filter edit", async () => {
    const user = userEvent.setup();
    renderPage("/?process=1&compare=3&academic_area=SALUD");
    await user.click(await screen.findByLabelText(/Abrir filtros de carreras/));
    await user.selectOptions(screen.getByLabelText("Área académica"), "ING");
    await user.click(screen.getByRole("button", { name: /Restablecer filtros/ }));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 500)); });
    await waitFor(() => {
      const saved = JSON.parse(sessionStorage.getItem("unmsm-dashboard-view")!);
      expect(saved.filters).toEqual({ academicArea: "", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
      expect(saved.comparisons).toBeUndefined();
    });
    await user.click(screen.getByLabelText(/Abrir filtros de carreras/));
    expect(screen.getByLabelText("Área académica")).toHaveValue("");
  });

  it("ignores retired comparison settings and removes legacy comparison URLs while preserving filters", async () => {
    sessionStorage.setItem("unmsm-dashboard-view", JSON.stringify({ comparisons: ["3"], filters: { academicArea: "ING", faculty: "", modality: DEFAULT_ADMISSION_MODALITY } }));
    renderPage("/?process=1&compare=4");
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?process=1"));
    expect(screen.getByTestId("location")).not.toHaveTextContent("compare=");
    expect(api.useAnalyticsOverview).toHaveBeenLastCalledWith("1", ["2"], { academicArea: "ING", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
    expect(api.useProcessHistory).toHaveBeenLastCalledWith({ academicArea: "ING", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
    const saved = JSON.parse(sessionStorage.getItem("unmsm-dashboard-view")!);
    expect(saved.comparisons).toBeUndefined();
    expect(saved.filters.academicArea).toBe("ING");
  });

  it("filters and sorts the major breakdown", async () => {
    const user = userEvent.setup();
    const richerOverview = {
      processes: [{
        ...overview.processes[0],
        majors: [
          overview.processes[0].majors[0],
          { major_id: 2, major_code: "DER", major_name: "Derecho", total_results: 20, admitted_count: 8, absent_count: 2, average_score: "80" },
        ],
      }],
    };
    vi.mocked(api.useAnalyticsOverview).mockReturnValue({
      data: richerOverview,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useAnalyticsOverview>);
    renderPage();

    const filter = await screen.findByRole("searchbox", { name: "Buscar carrera" });
    await user.type(filter, "dere");
    expect(screen.queryByRole("listbox", { name: "Carreras coincidentes" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("listbox", { name: "Carreras coincidentes" })).toBeInTheDocument());
    expect(screen.getByRole("option", { name: /Derecho/ })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /Derecho/ }).querySelector("button")!);
    expect(filter).toHaveValue("Derecho");
    const table = screen.getByRole("table");
    await waitFor(() => {
      expect(within(table).getByText("Derecho")).toBeInTheDocument();
      expect(within(table).queryByText("Ingeniería")).not.toBeInTheDocument();
    });

    await user.clear(filter);
    await user.selectOptions(screen.getByRole("combobox", { name: "Ordenar carreras" }), "average_score-desc");
    expect(screen.getByRole("status", { name: "Ordenando carreras" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("status", { name: "Ordenando carreras" })).not.toBeInTheDocument(), { timeout: 1000 });
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Derecho");
    expect(within(table).getByRole("link", { name: "Derecho" })).toHaveAttribute("href", `/analytics/careers/2?${new URLSearchParams({ process: "1", modality: DEFAULT_ADMISSION_MODALITY })}`);
  });
  it("shows visible feedback while refreshing existing analytics", async () => {
    vi.mocked(api.useAnalyticsOverview).mockReturnValue({
      data: overview,
      isPending: false,
      isFetching: true,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useAnalyticsOverview>);
    renderPage();

    expect(screen.getByTestId("overview-refreshing")).toHaveTextContent("Actualizando indicadores");
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Resumen de 2025-2" })).not.toBeInTheDocument();
  });
  it("shows loading and error states", async () => {
    vi.mocked(api.usePublishedProcesses).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    renderPage();
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    cleanup();
    vi.mocked(api.usePublishedProcesses).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(/no pudimos/i);
  });
  it.each([undefined, "", "   "])("defaults missing or legacy empty modality preferences before fetching data: %s", (modality) => {
    if (modality !== undefined) sessionStorage.setItem("unmsm-dashboard-view", JSON.stringify({ filters: { academicArea: "", faculty: "", modality } }));
    vi.mocked(api.useAnalyticsOverview).mockClear();
    vi.mocked(api.useProcessHistory).mockClear();
    renderPage();
    fireEvent.click(screen.getByLabelText(/Abrir filtros de carreras/));
    expect(screen.getByLabelText("Modalidad")).toHaveValue(DEFAULT_ADMISSION_MODALITY);
    expect(within(screen.getByLabelText("Modalidad")).queryByRole("option", { name: /Todas/ })).not.toBeInTheDocument();
    expect(vi.mocked(api.useAnalyticsOverview).mock.calls.every((call) => call[2]?.modality === DEFAULT_ADMISSION_MODALITY)).toBe(true);
    expect(vi.mocked(api.useProcessHistory).mock.calls.every((call) => call[0]?.modality === DEFAULT_ADMISSION_MODALITY)).toBe(true);
    expect(screen.getByText("El puntaje promedio considera solo a los ingresantes con puntaje válido.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quitar filtro Modalidad/ })).not.toBeInTheDocument();
  });

  it("preserves an explicit modality across process changes and reloads, and resets to basic education", async () => {
    const user = userEvent.setup();
    const view = renderPage("/?process=1&modality=Especial");
    await user.click(screen.getByLabelText(/Abrir filtros de carreras/));
    expect(screen.getByLabelText("Modalidad")).toHaveValue("Especial");
    await user.selectOptions(screen.getByLabelText("Proceso analizado"), "2");
    expect(api.useAnalyticsOverview).toHaveBeenLastCalledWith("2", ["3"], { academicArea: "", faculty: "", modality: "Especial" });
    expect(api.useProcessHistory).toHaveBeenLastCalledWith({ academicArea: "", faculty: "", modality: "Especial" });
    const majorLink = within(screen.getByRole("table")).getByRole("link", { name: "Ingeniería" });
    expect(new URL(majorLink.getAttribute("href")!, "http://localhost").searchParams.get("modality")).toBe("Especial");
    view.unmount();
    renderPage("/?process=2");
    await user.click(screen.getByLabelText(/Abrir filtros de carreras/));
    expect(screen.getByLabelText("Modalidad")).toHaveValue("Especial");
    await user.click(screen.getByRole("button", { name: /Restablecer filtros/ }));
    await user.click(screen.getByLabelText(/Abrir filtros de carreras/));
    expect(screen.getByLabelText("Modalidad")).toHaveValue(DEFAULT_ADMISSION_MODALITY);
    expect(api.useAnalyticsOverview).toHaveBeenLastCalledWith("2", ["3"], { academicArea: "", faculty: "", modality: DEFAULT_ADMISSION_MODALITY });
  });

  it("updates the shared modality from its own visible control", async () => {
    const user = userEvent.setup();
    renderPage("/?process=1");
    expect(screen.getByLabelText("Modalidad")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Modalidad"), "Especial");
    await waitFor(() => expect(api.useAnalyticsOverview).toHaveBeenLastCalledWith("1", ["2"], { academicArea: "", faculty: "", modality: "Especial" }));
    expect(api.useProcessHistory).toHaveBeenLastCalledWith({ academicArea: "", faculty: "", modality: "Especial" });
    await user.click(screen.getByLabelText(/Abrir filtros de carreras/));
    expect(screen.getAllByLabelText("Modalidad")).toHaveLength(1);
    expect(screen.getByLabelText("Área académica")).toBeInTheDocument();
  });

});
