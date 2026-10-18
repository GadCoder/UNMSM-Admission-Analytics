import { describe, expect, it } from "vitest";
import { normalizeComparisons } from "./comparisonSelection";

const processes = [
  { id: 9, year: 2026, sequence: "2", name: "2026-2" },
  { id: 7, year: 2026, sequence: "1", name: "2026-1" },
  { id: 5, year: 2025, sequence: "2", name: "2025-2" },
  { id: 3, year: 2025, sequence: "1", name: "2025-1" },
  { id: 1, year: 2024, sequence: "2", name: "2024-2" },
];

describe("normalizeComparisons", () => {
  it("deduplicates before limiting, excludes the primary, and follows chronological API order", () => {
    expect(normalizeComparisons("9", ["3", "9", "3", "7", "5", "1"], processes)).toEqual(["7", "5", "3"]);
  });
  it("retains unknown IDs for existing API validation instead of silently changing the selection", () => {
    expect(normalizeComparisons("9", ["999", "7"], processes)).toEqual(["7", "999"]);
  });
});
