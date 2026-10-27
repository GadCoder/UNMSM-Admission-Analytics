import { describe, expect, it } from "vitest";
import type { AdmissionProcess } from "../api/analytics.types";
import {
  assignCareerSeriesSlots,
  alignCareerHistory,
  canCompareAdmittedScores,
  canCompareMinimumScores,
  getCareerComparisonMetricValue,
  getComparableCareerMetricValues,
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
