import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CareerComparisonHistory } from "./CareerComparisonHistory";
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
  it("renders aligned historical rows, gaps, and the shared process tooltip", () => {
    const series: CareerComparisonSeries[] = [
      { id: 1, label: "Medicina", items: [record(1, "I", 100, 20), record(3, "III", 90, 30)] },
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
    expect(
      screen.getByRole("heading", { name: "¿Cómo han cambiado los resultados?" }),
    ).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Tasa de ingreso por carrera y proceso" });
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) => row.textContent?.replace(/\s+/g, "")),
    ).toEqual(["ProcesoMedicinaDerecho", "2025-I20%20%", "2025-IISindatos30%", "2025-III33.3%20%"]);
    expect(screen.getByText("2025-II", { selector: "strong" })).toBeInTheDocument();
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
    fireEvent.keyDown(keyboardControl!, { key: "Escape" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.keyDown(keyboardControl!, { key: "ArrowLeft" });
    expect(screen.getByRole("status").textContent).toContain("2025-I");
  });

  it("breaks lines at gaps and suppresses coverage insight when requests are incomplete", () => {
    const { container } = render(
      <CareerComparisonHistory
        series={[
          { id: 1, label: "Medicina", items: [record(1, "I", 100, 20), record(3, "III", 90, 30)] },
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
    expect(container.querySelectorAll("path")).toHaveLength(3);
    expect(screen.queryByText(/registró.*menor tasa/)).not.toBeInTheDocument();
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
      clientX: 800,
      clientY: 120,
    });
    expect(screen.getByRole("status").textContent).toContain("2025-II");
    getBounds.mockRestore();
  });

  it("shows a metric-specific empty state when every observation is unavailable", () => {
    const empty = record(1, "I", 0, 0);
    const { container } = render(
      <CareerComparisonHistory
        series={[{ id: 1, label: "Medicina", items: [empty] }]}
        processes={[process(1, "I")]}
        metric="admission_rate"
        onMetricChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("No hay datos históricos disponibles");
    expect(container.querySelector('svg[role="group"]')).toBeNull();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
