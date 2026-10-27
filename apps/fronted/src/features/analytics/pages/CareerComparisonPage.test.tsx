import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../api/analytics";
import type { MajorDetail, MajorDetailProcess } from "../api/analytics.types";
import { CareerComparisonPage } from "./CareerComparisonPage";

vi.mock("../api/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/analytics")>()),
  usePublishedProcesses: vi.fn(),
  useModalities: vi.fn(),
  useMajorCatalog: vi.fn(),
  useAcademicAreas: vi.fn(),
  useFaculties: vi.fn(),
  getMajorDetail: vi.fn(),
}));

const processes = [
  { id: 2, year: 2026, sequence: "26-II", name: "2026-II" },
  { id: 1, year: 2026, sequence: "26-I", name: "2026-I" },
];
const majors = [
  { id: 11, code: "011", name: "Medicina", faculty_id: 1 },
  { id: 22, code: "022", name: "Ingeniería", faculty_id: 2 },
  { id: 33, code: "033", name: "Derecho", faculty_id: 3 },
  { id: 44, code: "044", name: "Educación", faculty_id: 4 },
  { id: 55, code: "055", name: "Economía", faculty_id: 5 },
];
const modality = "EBR";

function row(
  process: (typeof processes)[number],
  total: number,
  admitted: number,
  min: number | null = 600,
  avg: string | null = "700",
  max: string | null = "800",
): MajorDetailProcess {
  return {
    process,
    total_results: total,
    admitted_count: admitted,
    absent_count: 2,
    average_score: avg,
    minimum_admitted_score: min,
    highest_score: max,
    admitted_score_modality_count: 1,
    admitted_score_modality: modality,
  };
}

function detail(id: number): MajorDetail {
  const selected = id === 11 ? row(processes[0], 100, 25, 600) : row(processes[0], 80, 8, 750);
  const history = id === 11 ? row(processes[1], 90, 20) : row(processes[1], 70, 10);
  return {
    major: {
      id,
      code: "00",
      name: majors.find((item) => item.id === id)?.name ?? "Carrera",
      faculty: "Facultad",
      academic_area: "Área",
      is_new: false,
    },
    selected_processes: [selected],
    history: [history],
  };
}

function renderPage(entry = "/comparar-carreras?careers=11,22&process=2&modality=1") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/comparar-carreras" element={<CareerComparisonPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function waitForRequests(requests: Map<string, unknown[]>, key: string, count: number) {
  return waitFor(() => expect(requests.get(key)).toHaveLength(count));
}

describe("CareerComparisonPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.usePublishedProcesses).mockReturnValue({
      data: processes,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.mocked(api.useModalities).mockReturnValue({
      data: [
        { id: 1, name: modality },
        { id: 2, name: "EBA" },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.mocked(api.useMajorCatalog).mockReturnValue({
      data: majors,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.mocked(api.useAcademicAreas).mockReturnValue({
      data: [{ id: 1, code: "A", name: "Área" }],
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(api.useFaculties).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(api.getMajorDetail).mockImplementation(async (id) => detail(Number(id)));
  });
  afterEach(cleanup);

  it("shows setup guidance for zero careers without comparative sections", () => {
    renderPage("/comparar-carreras?process=2&modality=1");
    expect(screen.getByRole("heading", { name: "Carreras para comparar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Resumen rápido" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Comparación detallada" }),
    ).not.toBeInTheDocument();
    const selectionPanel = screen.getByRole("region", { name: "Panel de selección de carreras" });
    expect(within(selectionPanel).getAllByRole("button", { name: "Añadir carrera" })).toHaveLength(
      1,
    );
    expect(
      within(selectionPanel).getByText(
        "Selecciona entre 2 y 4 carreras para comparar sus resultados.",
      ),
    ).toBeInTheDocument();
    expect(
      within(selectionPanel).getByRole("button", { name: "Reiniciar comparación" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Controles de comparación" })).queryByRole(
        "button",
        { name: "Reiniciar comparación" },
      ),
    ).not.toBeInTheDocument();
    expect(
      within(selectionPanel).queryByRole("button", { name: /Quitar .* de la comparación/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Explorar carreras|Explorar más carreras/ }),
    ).not.toBeInTheDocument();
    expect(api.getMajorDetail).not.toHaveBeenCalled();
  });

  it("shows available single-career data and prompts for another career without conclusions", async () => {
    renderPage("/comparar-carreras?careers=11&process=2&modality=1");
    expect(await screen.findByRole("heading", { name: "Medicina" })).toBeInTheDocument();
    expect(
      screen.getByText("Agrega otra carrera para ver comparaciones y conclusiones."),
    ).toBeInTheDocument();
    const selectionPanel = screen.getByRole("region", { name: "Panel de selección de carreras" });
    const addButton = within(selectionPanel).getByRole("button", { name: "Añadir carrera" });
    expect(addButton).toBeInTheDocument();
    const selectionRow = within(selectionPanel).getByLabelText("Carreras seleccionadas");
    const chipRemove = screen.getByRole("button", { name: "Quitar Medicina de la comparación" });
    expect(selectionRow).toContainElement(chipRemove);
    expect(selectionRow).toContainElement(addButton);
    expect(
      chipRemove.compareDocumentPosition(addButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Añadir carrera" })).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Resumen rápido" })).not.toBeInTheDocument();
  });

  it("caps selection at four, keeps order, and does not request a fifth career from an excessive URL", async () => {
    renderPage("/comparar-carreras?careers=44,33,22,11,55&process=2&modality=1");
    expect(
      await screen.findByRole("heading", { name: "Revisa los datos del enlace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Conservar las primeras cuatro" }),
    ).toBeInTheDocument();
    expect(api.getMajorDetail).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Añadir carrera" })).toBeDisabled();
  });

  it("returns focus to the button that opened the career search dialog", async () => {
    const originalShow = HTMLDialogElement.prototype.showModal;
    const originalClose = HTMLDialogElement.prototype.close;
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value() {
        this.setAttribute("open", "");
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value() {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      },
    });
    try {
      renderPage("/comparar-carreras?process=2&modality=1");
      const selectionPanel = screen.getByRole("region", { name: "Panel de selección de carreras" });
      const opener = within(selectionPanel).getByRole("button", { name: "Añadir carrera" });
      fireEvent.click(opener);
      const dialog = await screen.findByRole("dialog", { name: "Añadir carrera" });
      const input = within(dialog).getByRole("searchbox", { name: "Buscar por nombre" });
      expect(input).toHaveAttribute("placeholder", "Medicina, Derecho, Ingeniería…");
      await waitFor(() => expect(document.activeElement).toBe(input));
      fireEvent.change(input, { target: { value: "Derecho" } });
      expect(within(dialog).getByRole("button", { name: /Derecho/ })).toBeInTheDocument();
      expect(within(dialog).queryByRole("button", { name: /Ingeniería/ })).not.toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole("button", { name: "Limpiar búsqueda" }));
      expect(input).toHaveValue("");
      expect(document.activeElement).toBe(input);
      expect(within(dialog).getByRole("button", { name: /Ingeniería/ })).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar búsqueda" }));
      await waitFor(() => expect(document.activeElement).toBe(opener));
    } finally {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: originalShow,
      });
      Object.defineProperty(HTMLDialogElement.prototype, "close", {
        configurable: true,
        value: originalClose,
      });
    }
  });

  it("keeps the selection button in place and returns focus to it after adding the first career", async () => {
    const originalShow = HTMLDialogElement.prototype.showModal;
    const originalClose = HTMLDialogElement.prototype.close;
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value() {
        this.setAttribute("open", "");
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value() {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      },
    });
    try {
      renderPage("/comparar-carreras?process=2&modality=1");
      const selectionPanel = screen.getByRole("region", { name: "Panel de selección de carreras" });
      const persistentAddButton = within(selectionPanel).getByRole("button", {
        name: "Añadir carrera",
      });
      fireEvent.click(persistentAddButton);
      const dialog = await screen.findByRole("dialog", { name: "Añadir carrera" });
      fireEvent.click(within(dialog).getByRole("button", { name: /Medicina/ }));
      await waitFor(() => {
        const currentAddButton = within(
          screen.getByRole("region", { name: "Panel de selección de carreras" }),
        ).getByRole("button", { name: "Añadir carrera" });
        expect(currentAddButton).toBe(persistentAddButton);
        expect(document.activeElement).toBe(persistentAddButton);
        expect(screen.getByLabelText("Carreras seleccionadas")).toContainElement(
          screen.getByRole("button", { name: "Quitar Medicina de la comparación" }),
        );
      });
    } finally {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: originalShow,
      });
      Object.defineProperty(HTMLDialogElement.prototype, "close", {
        configurable: true,
        value: originalClose,
      });
    }
  });

  it("recovers malformed ids and deduplicates valid ids before any request", async () => {
    renderPage("/comparar-carreras?careers=11,broken,11&process=2&modality=1");
    expect(await screen.findByText(/formato no válido/)).toBeInTheDocument();
    expect(api.getMajorDetail).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Quitar selecciones no válidas" }));
    expect(await screen.findByRole("heading", { name: "Medicina" })).toBeInTheDocument();
    expect(api.getMajorDetail).toHaveBeenCalledTimes(1);
  });

  it("renders current metrics, tie-safe summaries, score references, and detailed absent counts", async () => {
    renderPage();
    const summary = await screen.findByRole("region", { name: "Resumen rápido" });
    expect(await within(summary).findByText("Menor tasa de ingreso")).toBeInTheDocument();
    expect(within(summary).getByText("Menor tasa de ingreso").parentElement).toHaveTextContent(
      "Ingeniería",
    );
    expect(within(summary).getByText("Mayor demanda registrada").parentElement).toHaveTextContent(
      "Medicina",
    );
    expect(
      within(summary).getByText("Puntaje mínimo de ingreso más alto").parentElement,
    ).toHaveTextContent("Ingeniería");
    expect(screen.getByRole("heading", { name: "Puntajes de referencia" })).toBeInTheDocument();
    const scoreSection = screen.getByRole("region", { name: "Puntajes de referencia" });
    const scoreTable = within(scoreSection).getByRole("table");
    expect(await within(scoreTable).findByText("750")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Explorar carreras" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Explorar más carreras" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Comparación detallada/ }));
    const detailed = document.getElementById("comparison-detail")!;
    expect(within(detailed).getByRole("row", { name: /Ausentes/ })).toHaveTextContent("2");
  });

  it("reports tied rates once and keeps zero-result careers out of rate rankings", async () => {
    vi.mocked(api.getMajorDetail).mockImplementation(async (id) => {
      const result = detail(Number(id));
      return { ...result, selected_processes: [row(processes[0], 100, 10)] };
    });
    renderPage();
    const summary = await screen.findByRole("region", { name: "Resumen rápido" });
    expect(await within(summary).findByText("Misma tasa de ingreso")).toBeInTheDocument();
    expect(within(summary).queryByText("Menor tasa de ingreso")).not.toBeInTheDocument();

    cleanup();
    vi.mocked(api.getMajorDetail).mockImplementation(async (id) => {
      const result = detail(Number(id));
      return {
        ...result,
        selected_processes: [
          row(processes[0], Number(id) === 11 ? 100 : 0, Number(id) === 11 ? 20 : 0),
        ],
      };
    });
    renderPage();
    const noDataCard = await screen.findByText("Sin datos para este proceso y modalidad.");
    expect(noDataCard.closest("article")).toHaveTextContent("Ingeniería");
    expect(screen.queryByText("Misma tasa de ingreso")).not.toBeInTheDocument();
  });

  it("keeps successful chart data on partial failure and suppresses comparative conclusions", async () => {
    vi.mocked(api.getMajorDetail).mockImplementation(async (id) => {
      if (Number(id) === 22) throw new Error("offline");
      return detail(Number(id));
    });
    renderPage();
    expect(await screen.findByText(/No pudimos cargar algunas carreras/)).toBeInTheDocument();
    expect(screen.queryByText("Menor tasa de ingreso")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Tasa de ingreso por proceso/)).toBeInTheDocument();
    expect(screen.getByText("Medicina", { selector: "h3" })).toBeInTheDocument();
  });

  it("recovers an explicitly unavailable process or modality without silently changing it", async () => {
    renderPage("/comparar-carreras?careers=11,22&process=999&modality=1");
    expect(screen.getByRole("heading", { name: "Proceso no disponible" })).toBeInTheDocument();
    expect(api.getMajorDetail).not.toHaveBeenCalled();
  });

  it("uses pending full-history responses for the newly selected process without refetching", async () => {
    const waiting = new Map<number, (value: MajorDetail) => void>();
    vi.mocked(api.getMajorDetail).mockImplementation(
      (id) => new Promise((resolve) => waiting.set(Number(id), resolve)),
    );
    renderPage();
    await waitFor(() => expect(waiting.size).toBe(2));
    fireEvent.change(screen.getByLabelText("Proceso analizado"), { target: { value: "1" } });
    expect(api.getMajorDetail).toHaveBeenCalledTimes(2);
    for (const id of [11, 22]) {
      waiting.get(id)!({
        ...detail(id),
        selected_processes: [row(processes[0], 1000, 900)],
        history: [row(processes[1], id === 11 ? 100 : 200, id === 11 ? 1 : 20)],
      });
    }
    const summary = await screen.findByRole("region", { name: "Resumen rápido" });
    expect(await within(summary).findByText("1%", { selector: "small" })).toBeInTheDocument();
    expect(within(summary).queryByText("90%", { selector: "small" })).not.toBeInTheDocument();
    expect(api.getMajorDetail).toHaveBeenCalledTimes(2);
  });

  it("starts career histories while the independent career catalog is still loading", async () => {
    vi.mocked(api.useMajorCatalog).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as never);
    renderPage();
    expect(screen.getByText("Cargando catálogo de carreras…")).toBeInTheDocument();
    await waitFor(() => expect(api.getMajorDetail).toHaveBeenCalledTimes(2));
  });

  it("does not request careers that a loaded catalog identifies as unavailable", () => {
    vi.mocked(api.useMajorCatalog).mockReturnValue({
      data: majors.filter((major) => major.id !== 22),
      isPending: false,
      isError: false,
    } as never);
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Hay carreras que ya no están disponibles" }),
    ).toBeInTheDocument();
    expect(api.getMajorDetail).not.toHaveBeenCalled();
  });

  it("keeps late responses from the previous modality out of the active comparison", async () => {
    const waiting = new Map<string, Array<(value: MajorDetail) => void>>();
    vi.mocked(api.getMajorDetail).mockImplementation(
      (id, _processId, _compare, modalityName) =>
        new Promise((resolve) => {
          const key = String(modalityName);
          const resolves = waiting.get(key) ?? [];
          resolves.push(resolve as (value: MajorDetail) => void);
          waiting.set(key, resolves);
          if (key === "EBA") {
            const index = resolves.length - 1;
            setTimeout(
              () =>
                resolves[index]({
                  ...detail(Number(id)),
                  selected_processes: [
                    row(processes[0], Number(id) === 11 ? 100 : 200, Number(id) === 11 ? 1 : 20),
                  ],
                  history: [],
                }),
              0,
            );
          }
        }),
    );
    renderPage();
    await waitForRequests(waiting, "EBR", 2);
    fireEvent.change(screen.getByLabelText("Modalidad"), { target: { value: "2" } });
    await waitForRequests(waiting, "EBA", 2);
    const oldValues = waiting.get("EBR")!;
    oldValues[0]({
      ...detail(11),
      selected_processes: [row(processes[0], 1000, 900)],
      history: [],
    });
    oldValues[1]({
      ...detail(22),
      selected_processes: [row(processes[0], 1000, 900)],
      history: [],
    });
    const summary = await screen.findByRole("region", { name: "Resumen rápido" });
    expect(await within(summary).findByText("1%", { selector: "small" })).toBeInTheDocument();
    expect(within(summary).queryByText("90%", { selector: "small" })).not.toBeInTheDocument();
  });

  it("does not silently use the first modality when the EBR/EBA default is absent", async () => {
    vi.mocked(api.useModalities).mockReturnValue({
      data: [{ id: 3, name: "Especial" }],
      isPending: false,
      isError: false,
    } as never);
    renderPage("/comparar-carreras?careers=11,22&process=2");
    expect(screen.getByRole("heading", { name: "Modalidad no disponible" })).toBeInTheDocument();
    expect(api.getMajorDetail).not.toHaveBeenCalled();
  });
});
