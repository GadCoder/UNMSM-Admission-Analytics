import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CareerComparisonHistory } from "./CareerComparisonHistory";
import styles from "./CareerComparisonHistory.module.css";
import type { CareerComparisonSeries } from "../utils/careerComparison";

const process = (id: number, sequence: string) => ({
  id,
  year: 2025,
  sequence,
  name: `Proceso 2025-${sequence}`,
});
const record = (id: number, sequence: string, total: number, admitted: number) => ({
  process: process(id, sequence),
  total_results: total,
  admitted_count: admitted,
  absent_count: 0,
  average_score: "75.00",
  minimum_admitted_score: 60,
  highest_score: "88.00",
  admitted_score_modality_count: 1,
  admitted_score_modality: "Ordinario",
});

describe("CareerComparisonHistory", () => {
  afterEach(cleanup);
  it("renders the evolution heading and chronological values without opening a default panel", () => {
    const series: CareerComparisonSeries[] = [
      {
        id: 1,
        label: "Medicina",
        items: [record(1, "I", 100, 20), record(2, "II", 90, 27), record(3, "III", 90, 30)],
      },
      {
        id: 2,
        label: "Derecho",
        items: [record(1, "I", 80, 16), record(2, "II", 70, 21), record(3, "III", 90, 18)],
      },
    ];
    render(
      <CareerComparisonHistory
        series={series}
        processes={[process(3, "III"), process(1, "I"), process(2, "II")]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
        selectedProcessId={2}
      />,
    );
    expect(screen.getByRole("heading", { name: "Evolución histórica" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gráfico" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tabla" }));
    const table = screen.getByRole("table", { name: "Tasa de ingreso por carrera y proceso" });
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) => row.textContent?.replace(/\s+/g, "")),
    ).toEqual(["ProcesoMedicinaDerecho", "2025-I20%20%", "2025-II30%30%", "2025-III33.3%20%"]);
    expect(screen.queryByRole("slider", { name: "Proceso histórico" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gráfico" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("2025-II · Tasa de ingreso")).not.toBeInTheDocument();
  });

  it("labels each career value so the mobile process cards identify their metrics", () => {
    render(
      <CareerComparisonHistory
        series={[
          {
            id: 1,
            label: "Ingeniería de Sistemas y Computación",
            items: [record(1, "I", 100, 25)],
          },
          { id: 2, label: "Medicina", items: [] },
        ]}
        processes={[process(1, "I")]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tabla" }));
    const row = screen.getByRole("row", { name: /2025-I/ });
    expect(within(row).getByRole("rowheader")).toHaveTextContent("2025-I");
    const cells = within(row).getAllByRole("cell");
    expect(cells[0]).toHaveAttribute("data-label", "Ingeniería de Sistemas y Computación");
    expect(cells[0]).toHaveTextContent("25%");
    expect(cells[1]).toHaveAttribute("data-label", "Medicina");
    expect(cells[1]).toHaveTextContent("—");
  });

  it("supports keyboard process inspection and metric selection", () => {
    const onMetricChange = vi.fn();
    render(
      <CareerComparisonHistory
        series={[
          { id: 1, label: "Medicina", items: [record(1, "I", 10, 1), record(2, "II", 10, 2)] },
        ]}
        processes={[process(1, "I"), process(2, "II")]}
        metric="admission_rate"
        onMetricChange={onMetricChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Métrica"), { target: { value: "total_results" } });
    expect(onMetricChange).toHaveBeenCalledWith("total_results");
    const keyboardControl = screen.getByRole("slider", { name: "Proceso histórico" });
    expect(keyboardControl).not.toBeNull();
    fireEvent.keyDown(keyboardControl!, { key: "ArrowRight" });
    expect(screen.getByRole("status").textContent).toContain("2025-II");
    fireEvent.keyDown(keyboardControl!, { key: "Home" });
    expect(screen.getByRole("status").textContent).toContain("2025-I");
    fireEvent.keyDown(keyboardControl!, { key: "End" });
    expect(screen.getByRole("status").textContent).toContain("2025-II");
    expect(screen.getByRole("button", { name: "Quitar selección" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar selección" }));
    expect(screen.queryByText("2025-II · Tasa de ingreso")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar selección" })).not.toBeInTheDocument();
    fireEvent.keyDown(keyboardControl!, { key: "Escape" });
  });

  it("renders continuous lines when each career has a value for every process", () => {
    const { container } = render(
      <CareerComparisonHistory
        series={[
          {
            id: 1,
            label: "Medicina",
            items: [record(1, "I", 100, 20), record(2, "II", 70, 18), record(3, "III", 90, 30)],
          },
          {
            id: 2,
            label: "Derecho",
            items: [record(1, "I", 80, 16), record(2, "II", 70, 21), record(3, "III", 90, 18)],
          },
        ]}
        processes={[process(1, "I"), process(2, "II"), process(3, "III")]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
        insightsEnabled={false}
      />,
    );
    expect(container.querySelectorAll("path")).toHaveLength(2);
    expect(screen.queryByText(/registró.*menor tasa/)).not.toBeInTheDocument();
  });

  it("highlights legend careers on hover and focus, pins on activation, and clears stale pins", () => {
    const careers: CareerComparisonSeries[] = [
      { id: 1, label: "Medicina", items: [record(1, "I", 10, 1), record(2, "II", 10, 2)] },
      { id: 2, label: "Derecho", items: [record(1, "I", 10, 2), record(2, "II", 10, 3)] },
    ];
    const { container, rerender } = render(
      <CareerComparisonHistory
        series={careers}
        processes={[process(1, "I"), process(2, "II")]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
      />,
    );
    const medicinaButton = screen.getByRole("button", { name: "Medicina" });
    const derechoButton = screen.getByRole("button", { name: "Derecho" });
    const groupFor = (label: string) => container.querySelector(`g[aria-label="${label}"]`);

    fireEvent.pointerEnter(derechoButton);
    expect(groupFor("Derecho")?.getAttribute("class")).toContain(styles.highlightedSeries);
    expect(groupFor("Medicina")?.getAttribute("class")).toContain(styles.dimmedSeries);
    fireEvent.pointerLeave(derechoButton);
    expect(groupFor("Derecho")?.getAttribute("class") ?? "").not.toContain(
      styles.highlightedSeries,
    );

    fireEvent.focus(medicinaButton);
    expect(groupFor("Medicina")?.getAttribute("class")).toContain(styles.highlightedSeries);
    fireEvent.click(medicinaButton);
    expect(medicinaButton).toHaveAttribute("aria-pressed", "true");
    expect(groupFor("Medicina")?.getAttribute("class")).toContain(styles.highlightedSeries);
    fireEvent.click(medicinaButton);
    expect(medicinaButton).toHaveAttribute("aria-pressed", "false");
    expect(groupFor("Medicina")?.getAttribute("class") ?? "").not.toContain(
      styles.highlightedSeries,
    );

    fireEvent.click(derechoButton);
    expect(derechoButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(derechoButton, { key: "Escape" });
    expect(derechoButton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(medicinaButton);
    rerender(
      <CareerComparisonHistory
        series={[careers[1]]}
        processes={[process(1, "I"), process(2, "II")]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
      />,
    );
    expect(groupFor("Derecho")?.getAttribute("class") ?? "").not.toContain(styles.dimmedSeries);
  });

  it("preserves continuous lines for four careers with complete history", () => {
    const { container } = render(
      <CareerComparisonHistory
        series={[
          {
            id: 1,
            label: "Medicina",
            items: [record(1, "I", 100, 20), record(2, "II", 100, 21), record(3, "III", 100, 22)],
          },
          {
            id: 2,
            label: "Derecho",
            items: [record(1, "I", 100, 25), record(2, "II", 100, 24), record(3, "III", 100, 23)],
          },
          {
            id: 3,
            label: "Educación",
            items: [record(1, "I", 100, 30), record(2, "II", 100, 31), record(3, "III", 100, 32)],
          },
          {
            id: 4,
            label: "Ingeniería",
            items: [record(1, "I", 100, 15), record(2, "II", 100, 16), record(3, "III", 100, 17)],
          },
        ]}
        processes={[process(1, "I"), process(2, "II"), process(3, "III")]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
        insightsEnabled={false}
      />,
    );
    const chart = container.querySelector('svg[role="group"]');
    expect(chart?.querySelectorAll("path")).toHaveLength(4);
    expect(
      [...chart!.querySelectorAll("path")].every((path) => path.getAttribute("d")?.includes("L")),
    ).toBe(true);
  });

  it("shows points and unavailable prior values for careers with different historical starting points", () => {
    const p1 = process(1, "I");
    const p2 = process(2, "II");
    const p3 = process(3, "III");
    const p4 = process(4, "IV");
    const { container } = render(
      <CareerComparisonHistory
        series={[
          {
            id: 1,
            label: "Completa",
            items: [
              record(1, "I", 100, 20),
              record(2, "II", 100, 21),
              record(3, "III", 100, 22),
              record(4, "IV", 100, 23),
            ],
          },
          { id: 2, label: "Un proceso", items: [record(4, "IV", 100, 30)] },
          {
            id: 3,
            label: "Dos procesos",
            items: [record(3, "III", 100, 10), record(4, "IV", 100, 20)],
          },
          {
            id: 4,
            label: "Desde el segundo",
            items: [record(2, "II", 100, 25), record(3, "III", 100, 26), record(4, "IV", 100, 27)],
          },
        ]}
        processes={[p4, p2, p1, p3]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
        selectedProcessId={p2.id}
        insightsEnabled={false}
      />,
    );
    const chart = container.querySelector('svg[role="group"]');
    const oneObservationLine = chart?.querySelector('g[aria-label="Un proceso"] path');
    const twoObservationLine = chart?.querySelector('g[aria-label="Dos procesos"] path');
    expect(oneObservationLine?.getAttribute("d")).toMatch(/^M /);
    expect(oneObservationLine?.getAttribute("d")).not.toContain(" L ");
    expect(twoObservationLine?.getAttribute("d")).toContain(" L ");
    fireEvent.keyDown(screen.getByRole("slider", { name: "Proceso histórico" }), {
      key: "End",
    });
    expect(screen.getByRole("status").textContent).toContain("Un proceso");
    expect(screen.getByText(/Datos disponibles para esta métrica en 2025-IV/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tabla" }));
    const table = screen.getByRole("table");
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) => row.textContent?.replace(/\s+/g, "")),
    ).toEqual([
      "ProcesoCompletaUnprocesoDosprocesosDesdeelsegundo",
      "2025-I20%———",
      "2025-II21%——25%",
      "2025-III22%—10%26%",
      "2025-IV23%30%20%27%",
    ]);
  });

  it("opens the shared values with a touch pointer interaction", () => {
    const bounds = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 840,
      bottom: 300,
      width: 840,
      height: 300,
      toJSON: () => ({}),
    } as DOMRect;
    const getBounds = vi
      .spyOn(SVGSVGElement.prototype, "getBoundingClientRect")
      .mockReturnValue(bounds);
    render(
      <CareerComparisonHistory
        series={[
          { id: 1, label: "Medicina", items: [record(1, "I", 10, 1), record(2, "II", 10, 2)] },
        ]}
        processes={[process(1, "I"), process(2, "II")]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
      />,
    );
    fireEvent.pointerDown(screen.getByRole("slider", { name: "Proceso histórico" }), {
      clientX: 600,
      clientY: 120,
    });
    expect(screen.getByRole("status").textContent).toContain("2025-II");
    getBounds.mockRestore();
  });

  it("keeps selected career names visible during loading and partial failure", () => {
    const { rerender } = render(
      <CareerComparisonHistory
        series={[]}
        processes={[]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
        loading
        expectedCareers={[
          { id: 1, label: "Medicina" },
          { id: 2, label: "Derecho" },
        ]}
      />,
    );
    expect(screen.getByText("Cargando datos históricos…")).toBeInTheDocument();
    expect(screen.getByText("Medicina")).toBeInTheDocument();
    rerender(
      <CareerComparisonHistory
        series={[]}
        processes={[]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
        failed
        expectedCareers={[{ id: 1, label: "Medicina" }]}
      />,
    );
    expect(
      screen.getByText("No se pudieron cargar todos los datos históricos."),
    ).toBeInTheDocument();
  });
});
