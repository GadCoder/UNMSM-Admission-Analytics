import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { MajorDetailProcess } from "../api/analytics.types";
import { CareerComparisonScores } from "./CareerComparisonScores";
import { getCareerScoreDomain } from "./careerComparisonScores.utils";

function record(
  min: number | null,
  average: string | null,
  max: number | string | null,
): MajorDetailProcess {
  return {
    process: { id: 1, year: 2026, sequence: "26-I", name: "2026-I" },
    total_results: 10,
    admitted_count: 3,
    absent_count: 0,
    minimum_admitted_score: min,
    average_score: average,
    highest_score: max === null ? null : String(max),
    admitted_score_modality_count: 1,
    admitted_score_modality: "EBR",
  };
}

describe("CareerComparisonScores", () => {
  afterEach(cleanup);

  it("uses a rounded padded domain, including for a zero-only range", () => {
    expect(getCareerScoreDomain([23, 47])).toEqual({
      min: 20,
      max: 50,
      ticks: [20, 25, 30, 35, 40, 45, 50],
    });
    expect(getCareerScoreDomain([0])).toEqual({ min: 0, max: 0.25, ticks: [0, 0.25] });
  });

  it.each([2, 3, 4])("keeps long career names and exact values with %i careers", (count) => {
    const selected = Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      label: `Carrera de nombre muy extenso para comprobar ajuste de pantalla ${index + 1}`,
      current: record(index === 0 ? 0 : 0, "0", 0),
    }));
    render(<CareerComparisonScores selected={selected} seriesSlots={new Map()} />);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(count * 3);
    for (let index = 1; index <= count; index += 1) {
      expect(
        screen.getAllByText(
          `Carrera de nombre muy extenso para comprobar ajuste de pantalla ${index}`,
          { exact: true },
        ),
      ).toHaveLength(2);
    }
    expect(screen.getByText("Promedio aritmético")).toBeInTheDocument();
  });

  it("distinguishes zero from missing values and preserves incomplete ranges", () => {
    render(
      <CareerComparisonScores
        selected={[
          { id: 1, label: "Cero válido", current: record(0, "0", 0) },
          { id: 2, label: "Promedio ausente", current: record(0, null, 10) },
          { id: 3, label: "Rango ausente", current: record(null, "5", 10) },
        ]}
        seriesSlots={new Map()}
      />,
    );
    expect(screen.getAllByText("Rango incompleto")).toHaveLength(1);
    const mobileTable = screen.getAllByRole("table")[1];
    expect(within(mobileTable).getAllByRole("row", { name: /Promedio ausente/ })).toHaveLength(1);
    expect(within(mobileTable).getAllByText("—").length).toBeGreaterThan(0);
    expect(within(mobileTable).getAllByText("0").length).toBeGreaterThan(0);
  });

  it("keeps modality mismatch and zero-result careers out of the chart", () => {
    const differentModality = {
      ...record(10, "11", 12),
      admitted_score_modality: "EBA",
    };
    const noResults = { ...record(10, "11", 12), total_results: 0 };
    render(
      <CareerComparisonScores
        selected={[
          { id: 1, label: "EBR", current: record(10, "11", 12) },
          { id: 2, label: "EBA", current: differentModality },
          { id: 3, label: "Sin postulantes", current: noResults },
        ]}
        seriesSlots={new Map()}
      />,
    );
    expect(screen.getAllByText("No comparable")).toHaveLength(8);
    expect(screen.getAllByText("Sin datos")).toHaveLength(8);
    expect(screen.getAllByRole("img", { name: /rango observado/ })).toHaveLength(1);
  });

  it("marks an average outside the observed range and does not draw its diamond", () => {
    render(
      <CareerComparisonScores
        selected={[{ id: 1, label: "Inconsistente", current: record(10, "15", 12) }]}
        seriesSlots={new Map()}
      />,
    );
    expect(screen.getAllByText(/promedio fuera del rango observado/i)).toHaveLength(2);
    expect(screen.queryAllByRole("img", { name: /rango observado de 10 a 12/i })).toHaveLength(0);
    expect(screen.getAllByText("15").length).toBeGreaterThan(0);
  });

  it("renders the average diamond at its scaled score position", () => {
    render(
      <CareerComparisonScores
        selected={[{ id: 1, label: "Career", current: record(10, "11", 12) }]}
        seriesSlots={new Map()}
      />,
    );
    const chart = screen.getByRole("img", { name: /promedio 11/i });
    const diamond = chart.querySelector("path");
    expect(diamond).toBeInTheDocument();
    expect(diamond?.getAttribute("d")).toMatch(/M 150 /);
  });

  it("shows the applicant explanation and only adds a caveat for mixed modalities", () => {
    const { rerender } = render(
      <CareerComparisonScores
        selected={[{ id: 1, label: "Carrera", current: record(12.345, "12.345", 13) }]}
        seriesSlots={new Map()}
      />,
    );
    expect(
      screen.getByText(
        /El puntaje mínimo es el menor puntaje válido registrado entre los ingresantes/,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("12.345").length).toBeGreaterThan(0);
    expect(screen.queryByText(/La comparación requiere/)).not.toBeInTheDocument();

    rerender(
      <CareerComparisonScores
        selected={[
          { id: 1, label: "EBR", current: record(12, "12", 13) },
          {
            id: 2,
            label: "EBA",
            current: { ...record(12, "12", 13), admitted_score_modality: "EBA" },
          },
        ]}
        seriesSlots={new Map()}
      />,
    );
    expect(
      screen.getByText(/La comparación requiere que las carreras compartan modalidad/),
    ).toBeInTheDocument();
  });
});
