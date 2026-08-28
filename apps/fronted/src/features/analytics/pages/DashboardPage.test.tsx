import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardPage } from "./DashboardPage";
import * as api from "../api/analytics";

vi.mock("../api/analytics", async (importOriginal) => ({
  ...await importOriginal<typeof import("../api/analytics")>(),
  usePublishedProcesses: vi.fn(),
  useAnalyticsOverview: vi.fn(),
  useAcademicAreas: vi.fn(),
  useFaculties: vi.fn(),
  useModalities: vi.fn(),
}));

const processes = [
  { id: 1, year: 2025, sequence: "2", name: "Proceso 2025-II" },
  { id: 2, year: 2025, sequence: "1", name: "Proceso 2025-I" },
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
function LocationProbe() { const location = useLocation(); return <output data-testid="location">{location.search}</output>; }
function renderPage(entry = "/") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[entry]}><DashboardPage /><LocationProbe /></MemoryRouter></QueryClientProvider>);
}

describe("DashboardPage", () => {
  beforeEach(() => {
    cleanup();
    vi.mocked(api.usePublishedProcesses).mockReturnValue({ data: processes, isPending: false, isError: false } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    vi.mocked(api.useAcademicAreas).mockReturnValue({ data: academicAreas, isPending: false, isError: false } as unknown as ReturnType<typeof api.useAcademicAreas>);
    vi.mocked(api.useFaculties).mockReturnValue({ data: faculties, isPending: false, isError: false } as unknown as ReturnType<typeof api.useFaculties>);
    vi.mocked(api.useModalities).mockReturnValue({ data: [], isPending: false, isError: false } as unknown as ReturnType<typeof api.useModalities>);
    vi.mocked(api.useAnalyticsOverview).mockReturnValue({
      data: overview,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useAnalyticsOverview>);
  });
  it("defaults to latest process and renders KPIs", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Proceso 2025-II" })).toBeInTheDocument();
    expect(await screen.findByText("100")).toBeInTheDocument();
    expect(screen.getByText("65.5")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
  it("updates URL when a comparison is selected", async () => {
    renderPage();
    await screen.findByRole("table");
    await userEvent.selectOptions(screen.getByDisplayValue("Proceso 2025-II"), "2");
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("process=2"));
  });
  it("renders accessible comparison and top-majors charts for selected processes", async () => {
    vi.mocked(api.useAnalyticsOverview).mockReturnValue({
      data: comparisonOverview,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof api.useAnalyticsOverview>);
    renderPage("/?process=1&compare=2");
    expect(await screen.findByRole("heading", { name: "Comparación de procesos" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /comparación de postulantes/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[1]).toHaveTextContent("Proceso 2025-I: 80 postulantes, 16 admitidos, 8 ausentes");
    expect(screen.getByRole("heading", { name: "Principales carreras por postulantes" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Principales carreras por postulantes" })).toBeInTheDocument();
    expect(screen.getAllByText("Ingeniería").length).toBeGreaterThan(1);
    expect(screen.queryByText("ING")).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Postulantes" })).toBeInTheDocument();
  });

  it("filters faculty options by the selected academic area", async () => {
    const user = userEvent.setup();
    renderPage("/?academic_area=SALUD");

    await user.click(screen.getByText("Filtros"));
    const faculty = await screen.findByLabelText("Facultad");
    expect(within(faculty).getByRole("option", { name: "Medicina" })).toBeInTheDocument();
    expect(within(faculty).queryByRole("option", { name: "Ingeniería de Sistemas" })).not.toBeInTheDocument();
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

    const filter = await screen.findByRole("searchbox", { name: "Filtrar carreras" });
    await user.type(filter, "dere");
    const table = screen.getByRole("table");
    expect(within(table).getByText("Derecho")).toBeInTheDocument();
    expect(within(table).queryByText("Ingeniería")).not.toBeInTheDocument();

    await user.clear(filter);
    await user.selectOptions(screen.getByRole("combobox", { name: "Ordenar carreras" }), "average_score-desc");
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Derecho");
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
});
