import { describe, expect, it } from "vitest";

import type { ProcessOverview } from "../api/analytics.types";
import { buildComparisonInsights } from "./processComparisonInsights";

const processes: ProcessOverview[] = [
  { process: { id: 1, year: 2026, sequence: "26-2", name: "Admisión 2026 — 26-2" }, total_results: 27735, admitted_count: 5392, absent_count: 279, average_score: "837.94", highest_score: "1717.38", majors: [] },
  { process: { id: 6, year: 2026, sequence: "26-1", name: "Admisión 2026 — 26-1" }, total_results: 26518, admitted_count: 2772, absent_count: 339, average_score: "805.52", highest_score: "1679.13", majors: [] },
  { process: { id: 5, year: 2025, sequence: "25-2", name: "Admisión 2025 — 25-2" }, total_results: 25000, admitted_count: 3500, absent_count: 400, average_score: "790.00", highest_score: "1650.00", majors: [] },
];

describe("process comparison insights", () => {
  it("compares the two latest selected API periods after sorting their period suffix", () => {
    const insights = buildComparisonInsights(processes);

    expect(insights).toContainEqual(expect.objectContaining({ metric: "Postulantes", text: "2026-2 registró 27,735 postulantes, 4.6% más que 2026-1." }));
    expect(insights).toContainEqual(expect.objectContaining({ metric: "Tasa de ingreso", text: "2026-2 alcanzó 19.4%, frente al 10.5% de 2026-1." }));
    expect(insights).toContainEqual(expect.objectContaining({ metric: "Ausentismo", direction: "down", text: "La tasa cayó de 1.3% en 2026-1 a 1.0% en 2026-2." }));
  });
});
