import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { MajorDetailProcess } from "../api/analytics.types";
import { MetricHistoryChart } from "./MetricHistoryChart";

afterEach(cleanup);

const rows: MajorDetailProcess[] = [
  { process: { id: 1, year: 2025, sequence: "25-1", name: "" }, total_results: 100, admitted_count: 10, absent_count: 5, average_score: "70.0000", highest_score: "90.0000" },
  { process: { id: 2, year: 2026, sequence: "26-1", name: "" }, total_results: 140, admitted_count: 21, absent_count: 7, average_score: "75.0000", highest_score: "95.0000" },
];

describe("MetricHistoryChart", () => {
  it("shows the historical applicant line and changes metric from the selector", () => {
    render(<MetricHistoryChart items={rows} title="Evolución histórica" />);

    const chart = screen.getByRole("region", { name: "Evolución histórica" });
    expect(within(chart).getByLabelText("Métrica")).toHaveValue("total_results");
    expect(within(chart).getByText("Postulantes")).toBeInTheDocument();
    expect(within(chart).getByText("100")).toBeInTheDocument();
    expect(within(chart).getByText("140")).toBeInTheDocument();

    fireEvent.change(within(chart).getByLabelText("Métrica"), { target: { value: "admission_rate" } });

    expect(within(chart).getByText("Porcentaje de ingresantes")).toBeInTheDocument();
    expect(within(chart).getByText("10%")).toBeInTheDocument();
    expect(within(chart).getByText("15%")).toBeInTheDocument();
    expect(within(chart).getByRole("img", { name: "Porcentaje de ingresantes por proceso" })).toBeInTheDocument();
  });

  it("uses the selected value and unit for every metric", () => {
    render(<MetricHistoryChart items={rows} title="Evolución histórica" />);
    const chart = screen.getByRole("region", { name: "Evolución histórica" });
    const selector = within(chart).getByLabelText("Métrica");

    for (const [key, name, values] of [
      ["admitted_count", "Ingresantes por proceso", ["10", "21"]],
      ["absent_count", "Postulantes ausentes por proceso", ["5", "7"]],
      ["average_score", "Puntaje promedio por proceso", ["70", "75"]],
      ["highest_score", "Puntaje máximo por proceso", ["90", "95"]],
    ] as const) {
      fireEvent.change(selector, { target: { value: key } });
      expect(within(chart).getByRole("img", { name })).toBeInTheDocument();
      for (const value of values) expect(within(chart).getByText(value)).toBeInTheDocument();
    }
  });

  it("announces an empty historical series without drawing a misleading line", () => {
    render(<MetricHistoryChart items={[]} title="Evolución histórica" />);

    expect(screen.getByText("Aún no hay suficientes procesos publicados para mostrar una evolución histórica.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /por proceso/i })).not.toBeInTheDocument();
  });
});
