import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { ProcessOverview } from "../api/analytics.types";
import { KpiGrid } from "./KpiGrid";

const previous: ProcessOverview = {
  process: { id: 1, year: 2025, sequence: "25-2", name: "" },
  total_results: 100,
  admitted_count: 10,
  absent_count: 2,
  minimum_admitted_score: 800,
  admitted_score_modality_count: 1,
  admitted_score_modality: "Ordinario",
  average_score: "850",
  highest_score: "1000",
  majors: [],
};
const current: ProcessOverview = {
  ...previous,
  process: { id: 2, year: 2026, sequence: "26-1", name: "" },
  minimum_admitted_score: 810.1234,
  average_score: "840",
  highest_score: "1010",
};
afterEach(cleanup);

function metric(label: string) {
  return screen.getByText(label).closest("article")!;
}

describe("KpiGrid", () => {
  it("preserves the process overview cards, order and comparison styling by default", () => {
    render(<KpiGrid overview={current} previous={previous} />);
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.queryByText("Puntaje mínimo de ingreso")).not.toBeInTheDocument();
    expect(metric("Postulantes ausentes")).toBeInTheDocument();
    expect(
      screen.getByText("El puntaje promedio considera solo a los ingresantes con puntaje válido."),
    ).toBeInTheDocument();
    const labels = screen
      .getAllByRole("article")
      .map((item) => item.querySelector("span")?.textContent);
    expect(labels).toEqual([
      "Postulantes",
      "Postulantes ausentes",
      "Ingresantes",
      "Porcentaje de ingresantes",
      "Puntaje máximo",
      "Puntaje promedio*",
    ]);
    expect(
      within(metric("Puntaje máximo")).getByLabelText("Subió: +10 pts").parentElement?.className,
    ).toContain("kpiTrendPositive");
  });

  it("shows the minimum in the career row with point differences and neutral score arrows", () => {
    render(<KpiGrid variant="career" overview={current} previous={previous} />);
    const minimum = metric("Puntaje mínimo de ingreso");
    expect(within(minimum).getByText("810.12")).toBeInTheDocument();
    expect(within(minimum).getByText("+10.12 pts")).toHaveAttribute(
      "title",
      "vs 800 pts en 2025-2",
    );
    for (const [label, change] of [
      ["Puntaje mínimo de ingreso", "Subió: +10.12 pts"],
      ["Puntaje promedio", "Bajó: -10 pts"],
      ["Puntaje máximo", "Subió: +10 pts"],
    ]) {
      expect(within(metric(label)).getByLabelText(change).parentElement?.className).toContain(
        "kpiTrendNeutral",
      );
    }
    expect(minimum).toHaveAttribute(
      "title",
      "Menor puntaje obtenido por un ingresante en este proceso.",
    );
    const average = metric("Puntaje promedio");
    const note = screen.getByText(
      "El puntaje promedio considera solo a los ingresantes con puntaje válido.",
    );
    expect(average.title).toBe(note.textContent?.replace("* ", ""));
    expect(average.querySelector("sup")).toHaveTextContent("*");
    expect(average).toHaveAttribute("aria-describedby", note.id);
  });

  it.each([
    { ...current, minimum_admitted_score: null },
    { ...current, admitted_score_modality: "Especial" },
    { ...current, admitted_score_modality: null },
    { ...current, admitted_score_modality_count: 2 },
    { ...current, minimum_admitted_score: Number.NaN },
  ])("omits missing or incomparable minimum comparisons", (overview) => {
    render(<KpiGrid variant="career" overview={overview} previous={previous} />);
    const minimum = metric("Puntaje mínimo de ingreso");
    expect(within(minimum).queryByText("No disponible")).not.toBeInTheDocument();
    expect(within(minimum).queryByLabelText(/Comparación no disponible/)).not.toBeInTheDocument();
  });

  it("does not substitute an older observation when the previous score is missing", () => {
    render(
      <KpiGrid
        variant="career"
        overview={current}
        previous={{ ...previous, minimum_admitted_score: null }}
      />,
    );
    expect(
      within(metric("Puntaje mínimo de ingreso")).queryByText("No disponible"),
    ).not.toBeInTheDocument();
  });

  it("omits the minimum comparison when the career has no prior process", () => {
    render(<KpiGrid variant="career" overview={current} />);
    expect(
      within(metric("Puntaje mínimo de ingreso")).queryByText("No disponible"),
    ).not.toBeInTheDocument();
  });

  it("preserves actual zero minimum scores", () => {
    render(
      <KpiGrid
        variant="career"
        overview={{ ...current, minimum_admitted_score: 0 }}
        previous={previous}
      />,
    );
    expect(within(metric("Puntaje mínimo de ingreso")).getByText("0")).toBeInTheDocument();
    expect(within(metric("Puntaje mínimo de ingreso")).getByText("-800 pts")).toBeInTheDocument();
  });
});
