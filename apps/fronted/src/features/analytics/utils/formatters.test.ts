import { describe, expect, it } from "vitest";

import { formatSignedDifference } from "./formatters";

describe("formatSignedDifference", () => {
  it("formats positive, negative, and zero differences with the correct sign", () => {
    expect(formatSignedDifference(1217)).toBe("+1,217");
    expect(formatSignedDifference(-235)).toBe("-235");
    expect(formatSignedDifference(0)).toBe("0");
  });

  it("preserves precision and suffixes", () => {
    expect(formatSignedDifference(-2.5, 1, " pp")).toBe("-2.5 pp");
  });
});
