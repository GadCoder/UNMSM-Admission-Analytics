import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { MajorDetailProcess } from "../api/analytics.types";
import { MetricHistoryChart } from "./MetricHistoryChart";

afterEach(cleanup);

const rows: MajorDetailProcess[] = [
  {
    process: { id: 1, year: 2025, sequence: "25-1", name: "" },
    total_results: 100,
    admitted_count: 10,
    absent_count: 5,
    average_score: "70.0000",
    highest_score: "90.0000",
  },
  {
    process: { id: 2, year: 2026, sequence: "26-1", name: "" },
    total_results: 140,
    admitted_count: 21,
    absent_count: 7,
    average_score: "75.0000",
    highest_score: "95.0000",
  },
];

describe("MetricHistoryChart", () => {
  it("shows the historical applicant line and changes metric from the selector", () => {
    render(<MetricHistoryChart items={rows} title="Evolución histórica" />);

    const chart = screen.getByRole("region", { name: "Evolución histórica" });
    expect(within(chart).getByLabelText("Métrica")).toHaveValue("total_results");
    expect(within(chart).getByText("Postulantes")).toBeInTheDocument();
    expect(within(chart).getByRole("button", { name: /: 100[.]/ })).toBeInTheDocument();
    expect(within(chart).getByRole("button", { name: /: 140[.]/ })).toBeInTheDocument();

    fireEvent.change(within(chart).getByLabelText("Métrica"), {
      target: { value: "admission_rate" },
    });

    expect(within(chart).getByText("Porcentaje de ingresantes")).toBeInTheDocument();
    expect(within(chart).getByRole("button", { name: /: 10%[.]/ })).toBeInTheDocument();
    expect(within(chart).getByRole("button", { name: /: 15%[.]/ })).toBeInTheDocument();
    expect(
      within(chart).getByRole("img", { name: "Porcentaje de ingresantes por proceso" }),
    ).toBeInTheDocument();
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
      for (const value of values)
        expect(
          within(chart).getByRole("button", { name: new RegExp(`: ${value}[.]`) }),
        ).toBeInTheDocument();
    }
  });

  it("announces an empty historical series without drawing a misleading line", () => {
    render(<MetricHistoryChart items={[]} title="Evolución histórica" />);

    expect(
      screen.getByText(
        "Aún no hay suficientes procesos publicados para mostrar una evolución histórica.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /por proceso/i })).not.toBeInTheDocument();
  });
  it("supports minimum scores in the single chart with selected highlighting and a concise explanation", () => {
    const items = rows.map((row, index) => ({
      ...row,
      minimum_admitted_score: index === 0 ? 65.1234 : 70.5678,
      admitted_score_modality_count: 1,
      admitted_score_modality: "Ordinario",
    }));
    render(
      <MetricHistoryChart
        items={items}
        title="Evolución histórica"
        defaultMetric="minimum_admitted_score"
        selectedProcessId={2}
      />,
    );
    expect(screen.getByLabelText("Métrica")).toHaveValue("minimum_admitted_score");
    expect(
      screen.getByText(
        "Menor puntaje obtenido por un ingresante en cada proceso. Los resultados históricos no garantizan el ingreso futuro.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Las escalas y reglas históricas/)).not.toBeInTheDocument();
    const point = screen.getByRole("button", { name: /2026-1: 70.5678. Proceso seleccionado/ });
    expect(point.querySelector('[data-selected="true"]')).toBeInTheDocument();
    fireEvent.focus(point);
    expect(within(screen.getByRole("tooltip")).getByText("70.5678")).toBeInTheDocument();
    fireEvent.blur(point);
    fireEvent.focus(
      screen.getByRole("button", { name: "Información sobre comparabilidad de puntajes" }),
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Las escalas y reglas históricas no están documentadas",
    );
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Información sobre comparabilidad de puntajes" }),
      { key: "Escape" },
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Métrica"), { target: { value: "highest_score" } });
    expect(
      screen.queryByText(/Menor puntaje obtenido por un ingresante en cada proceso/),
    ).not.toBeInTheDocument();
  });

  it("keeps missing values as gaps and retains the user's metric choice when the process changes", () => {
    const items = rows.map((row, index) => ({
      ...row,
      minimum_admitted_score: index === 0 ? 65 : null,
    }));
    const { container, rerender } = render(
      <MetricHistoryChart
        items={items}
        title="Evolución histórica"
        defaultMetric="minimum_admitted_score"
      />,
    );
    expect(container.querySelectorAll("polyline")).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: /^2025-1:/ })).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Métrica"), { target: { value: "average_score" } });
    rerender(
      <MetricHistoryChart
        items={items}
        title="Evolución histórica"
        defaultMetric="total_results"
        selectedProcessId={1}
      />,
    );
    expect(screen.getByLabelText("Métrica")).toHaveValue("average_score");
  });

  it("shows only the selected minimum when historical minima are not comparable", () => {
    const items = [
      {
        ...rows[0],
        minimum_admitted_score: 0,
        admitted_score_modality_count: 0,
        admitted_score_modality: null,
      },
      {
        ...rows[1],
        minimum_admitted_score: 70.5,
        admitted_score_modality_count: 1,
        admitted_score_modality: "Ordinario",
      },
    ];
    render(
      <MetricHistoryChart
        items={items}
        title="Evolución histórica"
        defaultMetric="minimum_admitted_score"
        selectedProcessId={2}
      />,
    );
    expect(screen.getAllByRole("button", { name: /:/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /2026-1: 70.5/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /2025-1:/ })).not.toBeInTheDocument();
  });

  it("shows a neutral minimum-score historical pattern for consecutive observations of the same modality", () => {
    const items = rows.map((row, index) => ({
      ...row,
      minimum_admitted_score: index === 0 ? 900 : 850.125,
      admitted_score_modality_count: 1,
      admitted_score_modality: "Ordinario",
    }));
    render(
      <MetricHistoryChart
        items={items}
        title="Evolución histórica"
        defaultMetric="minimum_admitted_score"
        selectedProcessId={2}
      />,
    );
    expect(screen.getByText("Patrón histórico")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Entre 2025-1 y 2026-1, el puntaje mínimo de ingreso disminuyó 49.88 puntos en esta modalidad.",
      ),
    ).toBeInTheDocument();
  });

  it("describes a sustained minimum-score pattern using the consecutive segment", () => {
    const items = [900, 950, 1000].map((score, index) => ({
      ...rows[0],
      process: {
        ...rows[0].process,
        id: index + 1,
        year: 2024 + index,
        sequence: `${24 + index}-1`,
      },
      minimum_admitted_score: score,
      admitted_score_modality_count: 1,
      admitted_score_modality: "Ordinario",
    }));
    render(
      <MetricHistoryChart
        items={items}
        title="Evolución histórica"
        defaultMetric="minimum_admitted_score"
      />,
    );
    expect(
      screen.getByText(
        /aumentó 100 puntos a lo largo de 3 procesos consecutivos en esta modalidad/,
      ),
    ).toBeInTheDocument();
  });

  it.each(["missing", "different", "unknown", "mixed"])(
    "does not infer a pattern across %s minimum-score observations",
    (kind) => {
      const items = [900, 950, 1000].map((score, index) => ({
        ...rows[0],
        process: {
          ...rows[0].process,
          id: index + 1,
          year: 2024 + index,
          sequence: `${24 + index}-1`,
        },
        minimum_admitted_score: index === 1 && kind === "missing" ? null : score,
        admitted_score_modality_count: index === 1 && kind === "mixed" ? 2 : 1,
        admitted_score_modality:
          index === 1
            ? kind === "different"
              ? "Especial"
              : kind === "unknown"
                ? null
                : "Ordinario"
            : "Ordinario",
      }));
      render(
        <MetricHistoryChart
          items={items}
          title="Evolución histórica"
          defaultMetric="minimum_admitted_score"
          selectedProcessId={3}
        />,
      );
      expect(screen.queryByText("Patrón histórico")).not.toBeInTheDocument();
    },
  );

  it("handles equal and genuine zero minima without inventing a directional pattern", () => {
    const items = rows.map((row) => ({
      ...row,
      minimum_admitted_score: 0,
      admitted_score_modality_count: 1,
      admitted_score_modality: "Ordinario",
    }));
    render(
      <MetricHistoryChart
        items={items}
        title="Evolución histórica"
        defaultMetric="minimum_admitted_score"
      />,
    );
    expect(
      screen.getByText(/el puntaje mínimo de ingreso se mantuvo en 0 puntos en esta modalidad/),
    ).toBeInTheDocument();
  });
});
