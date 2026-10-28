import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import * as api from "../api/analytics";
import { DEFAULT_ADMISSION_MODALITY } from "../utils/admissionModality";
import { CareerExplorerPage } from "./CareerExplorerPage";

vi.mock("../api/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/analytics")>()),
  usePublishedProcesses: vi.fn(),
  useModalities: vi.fn(),
  useAcademicAreas: vi.fn(),
  useFaculties: vi.fn(),
  useAnalyticsOverview: vi.fn(),
  useMajorDetail: vi.fn(),
}));

const processes = [
  { id: 24, year: 2026, sequence: "1", name: "Proceso 2026-I" },
  { id: 23, year: 2025, sequence: "2", name: "Proceso 2025-II" },
];
const areas = [
  { id: 1, code: "SALUD", name: "Ciencias de la Salud" },
  { id: 2, code: "ING", name: "Ingenierías" },
];
const faculties = [
  { id: 10, code: "MED", name: "Medicina", academic_area_id: 1 },
  { id: 20, code: "SIS", name: "Ingeniería de Sistemas", academic_area_id: 2 },
];
const overview = {
  processes: [
    {
      process: processes[0],
      total_results: 1000,
      admitted_count: 100,
      absent_count: 20,
      average_score: "70",
      highest_score: "100",
      majors: [
        {
          major_id: 42,
          major_code: "SIS",
          major_name: "Ingeniería de Sistemas",
          total_results: 500,
          admitted_count: 50,
          absent_count: 0,
          average_score: "80",
          is_new: false,
        },
        {
          major_id: 43,
          major_code: "DER",
          major_name: "Derecho",
          total_results: 300,
          admitted_count: 30,
          absent_count: 0,
          average_score: "70",
          is_new: false,
        },
        {
          major_id: 44,
          major_code: "MED",
          major_name: "Medicina Humana",
          total_results: 200,
          admitted_count: 20,
          absent_count: 0,
          average_score: "60",
          is_new: false,
        },
        {
          major_id: 45,
          major_code: "ODO",
          major_name: "Odontología",
          total_results: 100,
          admitted_count: 10,
          absent_count: 0,
          average_score: "60",
          is_new: false,
        },
      ],
    },
  ],
};
const detail = {
  major: {
    id: 42,
    code: "SIS",
    name: "Ingeniería de Sistemas",
    faculty: "Facultad de Ingeniería",
    academic_area: "Ingenierías",
    is_new: false,
  },
  selected_processes: [],
  history: [],
};
const ready = (data: unknown) => ({
  data,
  isPending: false,
  isFetching: false,
  isError: false,
  isSuccess: true,
  refetch: vi.fn(),
});

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">
        {location.pathname}
        {location.search}
        {location.hash}
      </output>
      <button type="button" onClick={() => navigate(-1)}>
        Atrás de prueba
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Adelante de prueba
      </button>
    </>
  );
}

function renderExplorer(entry = "/carreras") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const explorer = () => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/carreras/:majorId?" element={<CareerExplorerPage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  );
  const view = render(explorer());
  return { ...view, refresh: () => view.rerender(explorer()) };
}

function expectLocation(pathname: string, params: Record<string, string>) {
  const url = new URL(screen.getByTestId("location").textContent!, "https://example.test");
  expect(url.pathname).toBe(pathname);
  expect(Object.fromEntries(url.searchParams)).toEqual(params);
}

describe("CareerExplorerPage route integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.usePublishedProcesses).mockReturnValue(
      ready(processes) as unknown as ReturnType<typeof api.usePublishedProcesses>,
    );
    vi.mocked(api.useModalities).mockReturnValue(
      ready([
        { id: 1, name: DEFAULT_ADMISSION_MODALITY },
        { id: 2, name: "Especial" },
      ]) as unknown as ReturnType<typeof api.useModalities>,
    );
    vi.mocked(api.useAcademicAreas).mockReturnValue(
      ready(areas) as unknown as ReturnType<typeof api.useAcademicAreas>,
    );
    vi.mocked(api.useFaculties).mockReturnValue(
      ready(faculties) as unknown as ReturnType<typeof api.useFaculties>,
    );
    vi.mocked(api.useAnalyticsOverview).mockReturnValue(
      ready(overview) as unknown as ReturnType<typeof api.useAnalyticsOverview>,
    );
    vi.mocked(api.useMajorDetail).mockReturnValue(
      ready(detail) as unknown as ReturnType<typeof api.useMajorDetail>,
    );
  });
  afterEach(cleanup);

  it.each(["/carreras", "/carreras/42"])(
    "only offers modalities with results in the selected process on %s",
    async (route) => {
      vi.mocked(api.usePublishedProcesses).mockReturnValue(
        ready(
          processes.map((process, index) => ({
            ...process,
            available_modality_ids: index === 0 ? [1] : [1, 2],
          })),
        ) as unknown as ReturnType<typeof api.usePublishedProcesses>,
      );
      const user = userEvent.setup();
      renderExplorer(route);
      expect(within(screen.getByLabelText("Modalidad")).getAllByRole("option")).toHaveLength(1);
      await user.selectOptions(screen.getByLabelText("Proceso analizado"), "23");
      expect(within(screen.getByLabelText("Modalidad")).getAllByRole("option")).toHaveLength(2);
    },
  );

  it("uses latest process and default modality before its initial overview request", async () => {
    renderExplorer();
    expect(api.useAnalyticsOverview).toHaveBeenCalledWith(
      "24",
      [],
      expect.objectContaining({ modality: DEFAULT_ADMISSION_MODALITY }),
    );
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("24");
    await waitFor(() => {
      const url = new URLSearchParams(screen.getByTestId("location").textContent!.split("?")[1]);
      expect(url.get("process")).toBe("24");
      expect(url.get("modality")).toBe("1");
    });
  });

  it("starts independent browse catalogs while processes are still loading", () => {
    vi.mocked(api.usePublishedProcesses).mockReturnValue({
      ...ready(undefined),
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    renderExplorer();
    expect(screen.getByText("Cargando procesos…")).toBeInTheDocument();
    expect(api.useAcademicAreas).toHaveBeenCalledWith(true);
    expect(api.useFaculties).toHaveBeenCalledWith(true);
    expect(api.useAnalyticsOverview).not.toHaveBeenCalled();
  });

  it("leaves browse-only catalogs disabled on a career detail route", () => {
    renderExplorer("/carreras/42?process=24&modality=2");
    expect(api.useAcademicAreas).toHaveBeenCalledWith(false);
    expect(api.useFaculties).toHaveBeenCalledWith(false);
  });

  it("shows a concise selected modality while keeping the full option label", () => {
    renderExplorer("/carreras/42?process=24&modality=1");
    expect(screen.getByText("EBR y EBA")).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Modalidad")).getByRole("option", {
        name: "Educación Básica Regular (EBR) y Alternativa (EBA)",
      }),
    ).toBeInTheDocument();
  });

  it("syncs area and faculty choices to the URL and constrains faculties by area", async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.selectOptions(screen.getByLabelText("Área académica"), "ING");
    await user.selectOptions(screen.getByLabelText("Facultad"), "SIS");
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("academic_area=ING&faculty=SIS"),
    );
    expect(
      within(screen.getByLabelText("Facultad")).queryByRole("option", { name: "Medicina" }),
    ).not.toBeInTheDocument();
    expect(api.useAnalyticsOverview).toHaveBeenLastCalledWith(
      "24",
      [],
      expect.objectContaining({ academicArea: "ING", faculty: "SIS" }),
    );
  });

  it("keeps browse filters out of selected career analytics and offers a return to discovery", () => {
    renderExplorer(
      "/carreras/42?process=23&modality=2&academic_area=ING&faculty=SIS&q=sistemas&view=all",
    );
    expect(api.useAnalyticsOverview).not.toHaveBeenCalled();
    expect(api.useMajorDetail).toHaveBeenCalledWith("42", "23", [], "Especial");
    expect(screen.getAllByLabelText("Proceso analizado")).toHaveLength(1);
    expect(screen.getAllByLabelText("Modalidad")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Cambiar carrera/ })).toHaveAttribute(
      "href",
      expect.stringContaining("academic_area=ING"),
    );
    expect(
      screen.queryByRole("heading", { name: "Carreras con más postulantes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Comparar esta carrera" })).toHaveAttribute(
      "href",
      "/comparar-carreras?careers=42&process=23&modality=2",
    );
  });

  it("returns to a validated internal comparison URL and ignores external return targets", () => {
    renderExplorer(
      "/carreras/42?process=23&modality=2&returnTo=%2Fcomparar-carreras%3Fcareers%3D42%2C43%26process%3D24%26modality%3D1",
    );
    expect(screen.getByRole("link", { name: "Volver a comparar carreras" })).toHaveAttribute(
      "href",
      "/comparar-carreras?careers=42,43&process=24&modality=1",
    );
    cleanup();
    renderExplorer("/carreras/42?process=23&modality=2&returnTo=https%3A%2F%2Fexample.com%2F");
    expect(
      screen.queryByRole("link", { name: "Volver a comparar carreras" }),
    ).not.toBeInTheDocument();
  });

  it("retains discovery query and filters on career selection and returns to the query state with browser back", async () => {
    const user = userEvent.setup();
    renderExplorer(
      "/carreras?process=24&modality=2&academic_area=ING&faculty=SIS&q=sistemas&view=all",
    );
    await user.click(screen.getByRole("link", { name: /Ingeniería de Sistemas/ }));
    const context = {
      process: "24",
      modality: "2",
      academic_area: "ING",
      faculty: "SIS",
      q: "sistemas",
      view: "all",
    };
    expectLocation("/carreras/42", context);
    await user.click(screen.getByRole("button", { name: "Atrás de prueba" }));
    await waitFor(() => expectLocation("/carreras", context));
    expect(screen.getByLabelText("Busca tu carrera")).toHaveValue("sistemas");
  });

  it("keeps the current modality separate from the process return context when changing careers", async () => {
    const user = userEvent.setup();
    const processReturnTo = "/?process=24&academic_area=ING&modality=1";
    const params = new URLSearchParams({
      process: "24",
      modality: "1",
      returnTo: processReturnTo,
      q: "sistemas",
      view: "all",
    });
    renderExplorer(`/carreras/42?${params}`);
    await user.selectOptions(screen.getByLabelText("Modalidad"), "2");
    await user.click(screen.getByRole("link", { name: /Cambiar carrera/ }));
    expect(screen.getByLabelText("Busca tu carrera")).toHaveValue("sistemas");
    await user.click(screen.getByRole("link", { name: /Ingeniería de Sistemas/ }));
    expectLocation("/carreras/42", {
      process: "24",
      modality: "2",
      returnTo: processReturnTo,
      q: "sistemas",
      view: "all",
    });
    expect(api.useMajorDetail).toHaveBeenLastCalledWith("42", "24", [], "Especial");
    expect(screen.getByRole("link", { name: "Volver a resultados del proceso" })).toHaveAttribute(
      "href",
      processReturnTo,
    );
  });

  it("changes process from detail without leaving the selected career", async () => {
    const user = userEvent.setup();
    renderExplorer("/carreras/42?process=24&modality=2");
    await user.selectOptions(screen.getByLabelText("Proceso analizado"), "23");
    expect(screen.getByTestId("location")).toHaveTextContent("/carreras/42?process=23&modality=2");
    expect(api.useMajorDetail).toHaveBeenLastCalledWith("42", "23", [], "Especial");
  });

  it("shows catalog empty and catalog error states", () => {
    vi.mocked(api.usePublishedProcesses).mockReturnValue(
      ready([]) as unknown as ReturnType<typeof api.usePublishedProcesses>,
    );
    renderExplorer();
    expect(
      screen.getByText("Aún no hay procesos publicados para explorar carreras."),
    ).toBeInTheDocument();
    cleanup();
    vi.mocked(api.usePublishedProcesses).mockReturnValue({
      ...ready(undefined),
      data: undefined,
      isError: true,
      isPending: false,
    } as unknown as ReturnType<typeof api.usePublishedProcesses>);
    renderExplorer();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pudimos cargar los procesos de admisión.",
    );
  });

  it.each(["/carreras", "/carreras/42"])(
    "offers retry after a modality request fails on %s",
    async (pathname) => {
      const user = userEvent.setup();
      const refetch = vi.fn();
      vi.mocked(api.useModalities).mockReturnValue({
        ...ready(undefined),
        isError: true,
        refetch,
      } as unknown as ReturnType<typeof api.useModalities>);
      const view = renderExplorer(`${pathname}?process=24&modality=2`);
      expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar las modalidades.");
      expect(
        screen.queryByText("La modalidad seleccionada no está disponible."),
      ).not.toBeInTheDocument();
      expect(api.useMajorDetail).not.toHaveBeenCalled();
      expect(api.useAnalyticsOverview).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Reintentar modalidades" }));
      expect(refetch).toHaveBeenCalledOnce();

      vi.mocked(api.useModalities).mockReturnValue(
        ready([{ id: 2, name: "Especial" }]) as unknown as ReturnType<typeof api.useModalities>,
      );
      view.refresh();
      expect(screen.getByLabelText("Modalidad")).toHaveValue("2");
    },
  );

  it("allows replacing an invalid modality without editing the URL", async () => {
    const user = userEvent.setup();
    renderExplorer("/carreras?process=24&modality=999");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La modalidad seleccionada no está disponible.",
    );
    await user.click(screen.getByRole("button", { name: "Usar una modalidad disponible" }));
    expectLocation("/carreras", { process: "24", modality: "1" });
    expect(screen.getByLabelText("Modalidad")).toHaveValue("1");
  });

  it("shows pending modalities separately from request failures", () => {
    vi.mocked(api.useModalities).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as ReturnType<typeof api.useModalities>);
    renderExplorer("/carreras?process=24&modality=2");
    expect(screen.getByText("Cargando modalidades…")).toHaveAttribute("role", "status");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the selected career no-results state for the requested process and modality", () => {
    renderExplorer("/carreras/42?process=24&modality=2");
    expect(
      screen.getByText(
        "No hay resultados de esta carrera para el proceso y la modalidad seleccionados.",
      ),
    ).toHaveAttribute("role", "status");
  });
});
