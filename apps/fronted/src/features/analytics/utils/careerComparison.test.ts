import { describe, expect, it } from "vitest";
import type { AdmissionProcess } from "../api/analytics.types";
import {
  assignCareerSeriesSlots,
  alignCareerHistory,
  canCompareAdmittedScores,
  buildComparisonInsights,
  canCompareMinimumScores,
  getCareerComparisonMetricValue,
  getCareerHistoryDomain,
  getComparableCareerMetricValues,
  buildCareerHistoryInsight,
  getCareerSeriesStyle,
  getSharedHistoryMinimumInsight,
  mergeCareerHistory,
  rankCareerMetric,
  type CareerComparisonRecord,
} from "./careerComparison";

function row(
  id: number,
  year: number,
  sequence: string,
  total: number,
  admitted: number,
  extra: Partial<CareerComparisonRecord> = {},
): CareerComparisonRecord {
  return {
    process: { id, year, sequence, name: `Proceso ${year}-${sequence}` },
    total_results: total,
    admitted_count: admitted,
    absent_count: 0,
    average_score: "72.50",
    minimum_admitted_score: 60,
    highest_score: "90.00",
    admitted_score_modality_count: 1,
    admitted_score_modality: "Ordinario",
    ...extra,
  };
}

describe("career comparison metric helpers", () => {
  it("keeps real zeros and missing or undefined values separate", () => {
    const noAdmissions = row(1, 2025, "I", 8, 0);
    expect(getCareerComparisonMetricValue(noAdmissions, "admission_rate")).toBe(0);
    expect(getCareerComparisonMetricValue(noAdmissions, "applicants_per_admitted")).toBeNull();
    expect(getCareerComparisonMetricValue(row(2, 2025, "II", 0, 0), "admission_rate")).toBeNull();
    expect(getCareerComparisonMetricValue(null, "total_results")).toBeNull();
    expect(
      getCareerComparisonMetricValue(
        row(3, 2025, "III", 3, 1, { highest_score: "not a number" }),
        "highest_score",
      ),
    ).toBeNull();
  });

  it("requires a known, matching single modality for admitted-score comparisons", () => {
    const known = row(1, 2025, "I", 3, 1);
    const mixed = row(2, 2025, "II", 3, 1, { admitted_score_modality_count: 2 });
    const other = row(3, 2025, "III", 3, 1, { admitted_score_modality: "CEPRE" });
    expect(canCompareAdmittedScores(known, known)).toBe(true);
    expect(canCompareMinimumScores(known, known)).toBe(true);
    expect(canCompareAdmittedScores(known, mixed)).toBe(false);
    expect(
      canCompareMinimumScores(known, row(4, 2025, "IV", 3, 1, { minimum_admitted_score: null })),
    ).toBe(false);
    expect(canCompareAdmittedScores(known, other)).toBe(false);
    expect(getCareerComparisonMetricValue(mixed, "average_score")).toBeNull();
    expect(
      getComparableCareerMetricValues(
        [
          { id: 1, name: "A", record: known },
          { id: 2, name: "B", record: other },
        ],
        "minimum_admitted_score",
      ),
    ).toEqual([]);
  });

  it("ranks raw values and carries scope and ties", () => {
    expect(
      rankCareerMetric(
        [
          { id: 1, name: "A", value: 4.1231 },
          { id: 2, name: "B", value: 4.1232 },
          { id: 3, name: "C", value: null },
        ],
        "admission_rate",
        3,
      ),
    ).toMatchObject({
      minimum: [{ id: 1, name: "A", value: 4.1231 }],
      maximum: [{ id: 2, name: "B", value: 4.1232 }],
      scope: "Entre las carreras con datos (2 de 3)",
    });
    const tied = rankCareerMetric(
      [
        { id: 1, name: "A", value: 0 },
        { id: 2, name: "B", value: 0 },
      ],
      "admission_rate",
    );
    expect(tied.minimum).toHaveLength(2);
    expect(tied.tied).toBe(true);
  });

  it("merges by process ID, prefers selected records, and sorts numeric and Roman sequences", () => {
    const older = row(1, 2025, "II", 20, 2);
    const duplicate = row(1, 2025, "II", 99, 9);
    const newer = row(2, 2025, "IV", 30, 3);
    const excluded = row(3, 2026, "1", 40, 4);
    const result = mergeCareerHistory([duplicate, newer, excluded], [older], 2);
    expect(result.map((item) => item.process.id)).toEqual([1, 2]);
    expect(result[0].total_results).toBe(99);
    const roman: AdmissionProcess[] = [
      newer.process,
      row(4, 2025, "III", 1, 1).process,
      older.process,
    ];
    expect(
      roman
        .toSorted((a, b) => a.year - b.year || (a.sequence > b.sequence ? 1 : -1))
        .map((item) => item.id),
    ).toEqual([1, 4, 2]);
    expect(
      mergeCareerHistory(
        roman.map((process) => row(process.id, process.year, process.sequence, 1, 1)),
        [],
      ).map((item) => item.process.id),
    ).toEqual([1, 4, 2]);
    expect(
      mergeCareerHistory([row(5, 2026, "10", 1, 1), row(6, 2026, "2", 1, 1)], []).map(
        (item) => item.process.id,
      ),
    ).toEqual([6, 5]);
  });

  it("aligns process IDs with null gaps and reports only shared unique minima", () => {
    const processes = [
      row(1, 2025, "I", 10, 1).process,
      row(2, 2025, "II", 10, 1).process,
      row(3, 2026, "I", 10, 1).process,
    ];
    const aligned = alignCareerHistory(
      [
        {
          id: 1,
          label: "A",
          items: [row(1, 2025, "I", 10, 1), row(2, 2025, "II", 10, 1), row(3, 2026, "I", 10, 1)],
        },
        { id: 2, label: "B", items: [row(1, 2025, "I", 10, 2), row(3, 2026, "I", 10, 2)] },
      ],
      processes,
      "admission_rate",
    );
    expect(aligned.series[1].values[1]).toBeNull();
    expect(getSharedHistoryMinimumInsight(aligned)).toMatchObject({
      careerIds: [1],
      uniqueMinimumCount: 2,
      sharedProcessCount: 2,
    });
  });

  it("breaks admitted-score history when career populations do not match the selected process", () => {
    const selected = [
      row(2, 2025, "II", 10, 2),
      row(2, 2025, "II", 10, 2, { admitted_score_modality: "CEPRE" }),
    ];
    const aligned = alignCareerHistory(
      [
        { id: 1, label: "A", items: [row(1, 2025, "I", 10, 2), selected[0]] },
        {
          id: 2,
          label: "B",
          items: [row(1, 2025, "I", 10, 2, { admitted_score_modality: "CEPRE" }), selected[1]],
        },
      ],
      [row(1, 2025, "I", 10, 2).process, selected[0].process],
      "average_score",
      2,
    );
    expect(aligned.series.map((item) => item.values)).toEqual([
      [null, null],
      [null, null],
    ]);
  });

  it("keeps known historical admitted scores when the selected process has no valid scores", () => {
    const selectedWithoutScores = row(2, 2025, "II", 10, 2, {
      minimum_admitted_score: null,
      average_score: null,
      highest_score: null,
      admitted_score_modality_count: 0,
      admitted_score_modality: null,
    });
    const aligned = alignCareerHistory(
      [
        { id: 1, label: "A", items: [row(1, 2025, "I", 10, 2), selectedWithoutScores] },
        { id: 2, label: "B", items: [row(1, 2025, "I", 10, 2), selectedWithoutScores] },
      ],
      [row(1, 2025, "I", 10, 2).process, selectedWithoutScores.process],
      "average_score",
      2,
    );
    expect(aligned.series.map((item) => item.values)).toEqual([
      [72.5, null],
      [72.5, null],
    ]);
  });

  it("keeps visual slots stable across removal and reordering", () => {
    const slots = assignCareerSeriesSlots(new Map<number, number>(), [1, 7]);
    const firstSlot = slots.get(1);
    const secondSlot = slots.get(7);
    assignCareerSeriesSlots(slots, [7, 12]);
    expect(slots.get(1)).toBe(firstSlot);
    expect(slots.get(7)).toBe(secondSlot);
    expect(slots.get(12)).not.toBe(firstSlot);
    expect(getCareerSeriesStyle(firstSlot!).dash).not.toBe(getCareerSeriesStyle(secondSlot!).dash);
  });
});

describe("career historical evolution helpers", () => {
  it("scales admission rates from zero to a rounded bound that contains all selected series", () => {
    const aligned = alignCareerHistory(
      [
        { id: 1, label: "A", items: [row(1, 2024, "I", 100, 31)] },
        { id: 2, label: "B", items: [row(1, 2024, "I", 100, 16)] },
      ],
      [row(1, 2024, "I", 100, 31).process],
      "admission_rate",
    );
    expect(getCareerHistoryDomain(aligned, "admission_rate")).toEqual({
      min: 0,
      max: 40,
      ticks: [40, 30, 20, 10, 0],
    });
  });

  it("keeps valid zero observations in the historical domain", () => {
    const aligned = alignCareerHistory(
      [{ id: 1, label: "A", items: [row(1, 2024, "I", 10, 0)] }],
      [row(1, 2024, "I", 10, 0).process],
      "admission_rate",
    );
    expect(aligned.series[0].values).toEqual([0]);
    expect(getCareerHistoryDomain(aligned, "admission_rate").min).toBe(0);
  });

  it("sorts processes chronologically and describes admission-rate change in percentage points", () => {
    const early = row(2, 2024, "II", 100, 18);
    const late = row(3, 2026, "II", 100, 31);
    const aligned = alignCareerHistory(
      [{ id: 1, label: "Administración", items: [late, early] }],
      [late.process, early.process],
      "admission_rate",
    );
    expect(aligned.processes.map(({ year }) => year)).toEqual([2024, 2026]);
    expect(buildCareerHistoryInsight(aligned, "admission_rate")?.text).toContain(
      "aumento de 13 puntos porcentuales",
    );
  });

  it("avoids an insight for too few observations or zero change, and describes tied largest changes", () => {
    const one = row(1, 2024, "I", 100, 20);
    const two = row(2, 2025, "I", 100, 20);
    const three = row(3, 2026, "I", 100, 30);
    const single = alignCareerHistory(
      [{ id: 1, label: "A", items: [one] }],
      [one.process],
      "admission_rate",
    );
    const tied = alignCareerHistory(
      [
        { id: 1, label: "A", items: [one, three] },
        { id: 2, label: "B", items: [one, three] },
      ],
      [one.process, three.process],
      "admission_rate",
    );
    expect(buildCareerHistoryInsight(single, "admission_rate")).toBeNull();
    expect(buildCareerHistoryInsight(tied, "admission_rate")?.text).toContain(
      "La tasa de ingreso de A pasó de 20% en 2024-I a 30% en 2026-I",
    );
    expect(buildCareerHistoryInsight(tied, "admission_rate")?.text).not.toMatch(/mayor|única/i);
    expect(
      buildCareerHistoryInsight(
        alignCareerHistory(
          [{ id: 1, label: "A", items: [one, two] }],
          [one.process, two.process],
          "admission_rate",
        ),
        "admission_rate",
      ),
    ).toBeNull();
  });

  it("uses process dates for endpoint comparison and skips one-observation careers", () => {
    const early = row(1, 2024, "I", 100, 18);
    const late = row(2, 2025, "I", 100, 31);
    const oneRecord = row(2, 2025, "I", 100, 45);
    const aligned = alignCareerHistory(
      [
        { id: 1, label: "Solo un proceso", items: [oneRecord] },
        { id: 2, label: "Dos procesos", items: [early, late] },
      ],
      [early.process, late.process],
      "admission_rate",
    );
    const insight = buildCareerHistoryInsight(aligned, "admission_rate");
    expect(insight?.text).toContain("Dos procesos pasó de 18%");
    expect(insight?.text).not.toContain("Solo un proceso");
    expect(insight?.text).not.toMatch(/sostenid|continuamente/i);
    expect(insight?.text).toContain("Dos procesos pasó de 18% en 2024-I a 31% en 2025-I");
  });

  it("uses grammatical wording for applicants per admitted in an endpoint comparison", () => {
    const early = row(1, 2024, "I", 100, 20);
    const later = row(2, 2025, "I", 100, 25);
    const aligned = alignCareerHistory(
      [
        { id: 1, label: "A", items: [early, later] },
        {
          id: 2,
          label: "B",
          items: [row(1, 2024, "I", 100, 22), row(2, 2025, "I", 100, 21)],
        },
      ],
      [early.process, later.process],
      "applicants_per_admitted",
    );
    const insight = buildCareerHistoryInsight(aligned, "applicants_per_admitted");
    expect(insight?.text).toContain(
      "La relación de postulantes por ingresante de A pasó de 5 en 2024-I a 4 en 2025-I",
    );
    expect(insight?.text).not.toMatch(/El Postulantes/i);
  });

  it("generates mixed-coverage insights only from careers with enough chronological observations", () => {
    const p1 = row(1, 2024, "I", 100, 10);
    const p2 = row(2, 2024, "II", 100, 10);
    const p3 = row(3, 2025, "I", 100, 20);
    const p4 = row(4, 2025, "II", 100, 40);
    const aligned = alignCareerHistory(
      [
        { id: 1, label: "Nueva", items: [row(4, 2025, "II", 100, 95)] },
        { id: 2, label: "Reciente", items: [p3, p4] },
        { id: 3, label: "En crecimiento", items: [p2, p3, p4] },
        { id: 4, label: "Completa", items: [p1, p2, p3, row(4, 2025, "II", 100, 30)] },
      ],
      [p4.process, p2.process, p1.process, p3.process],
      "admission_rate",
    );
    expect(aligned.series.map((item) => item.values)).toEqual([
      [null, null, null, 95],
      [null, null, 20, 40],
      [null, 10, 20, 40],
      [10, 10, 20, 30],
    ]);
    expect(buildCareerHistoryInsight(aligned, "admission_rate")?.text).toContain(
      "En crecimiento pasó de 10% en 2024-II a 40% en 2025-II",
    );
  });
});

describe("buildComparisonInsights", () => {
  it("describes rate and demand differences and ties", () => {
    expect(
      buildComparisonInsights([
        { name: "A", admissionRate: 20, applicants: 100, admitted: 20 },
        { name: "B", admissionRate: 30, applicants: 100, admitted: 30 },
      ]),
    ).toEqual([
      {
        type: "admission_rate",
        text: "A registró una tasa de ingreso de 20%, frente al 30% de B: una diferencia de 10 puntos porcentuales.",
      },
    ]);
  });
  it("avoids minor differences and ignores unavailable measurements", () => {
    expect(
      buildComparisonInsights([
        { name: "A", admissionRate: 20, applicants: null, admitted: 0 },
        { name: "B", admissionRate: 20.5, applicants: null, admitted: 1 },
        { name: "C", admissionRate: null, applicants: null, admitted: 2 },
      ]),
    ).toEqual([]);
  });
  it("handles tied rates and zero counts without division", () => {
    expect(
      buildComparisonInsights([
        { name: "A", admissionRate: 25, applicants: 0, admitted: 0 },
        { name: "B", admissionRate: 25, applicants: 0, admitted: 0 },
      ]),
    ).toEqual([]);
  });
  it("uses correct singular and plural agreement for insight leaders", () => {
    expect(
      buildComparisonInsights([
        { name: "Administración", admissionRate: 20, applicants: 694, admitted: 100 },
        { name: "Derecho", admissionRate: 30, applicants: 161, admitted: 40 },
      ]),
    ).toEqual([
      {
        type: "admission_rate",
        text: "Administración registró una tasa de ingreso de 20%, frente al 30% de Derecho: una diferencia de 10 puntos porcentuales.",
      },
      {
        type: "demand",
        text: "Administración registró la mayor demanda, con 694 postulantes, frente a 161 en Derecho.",
      },
    ]);
  });
});
