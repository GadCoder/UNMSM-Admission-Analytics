import { describe, expect, it } from "vitest";

import { formatProcessLabel } from "./processLabels";

describe("formatProcessLabel", () => {
  it("removes the duplicated year from numbered process sequences", () => {
    expect(formatProcessLabel({ id: 1, year: 2026, sequence: "26-2", name: "Admisión 2026 — 26-2" })).toBe("2026-2");
  });

  it("preserves roman numeral sequences", () => {
    expect(formatProcessLabel({ id: 1, year: 2025, sequence: "II", name: "Proceso 2025-II" })).toBe("2025-II");
  });
});