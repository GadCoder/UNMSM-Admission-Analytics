import { describe, expect, it } from "vitest";

import { careerDetailHref, isValidComparisonReturnTo } from "./careerNavigation";
import { buildCareerComparisonHref } from "./careerComparisonUrl";

describe("career comparison navigation", () => {
  it("preserves a valid internal comparison return URL from career detail", () => {
    const returnTo = buildCareerComparisonHref({
      careerIds: [12, 34],
      processId: "9",
      modalityId: "1",
      metric: "average_score",
    });
    const detail = careerDetailHref(12, 9, { modalityId: "1", comparisonReturnTo: returnTo });
    expect(new URLSearchParams(detail.split("?")[1]).get("returnTo")).toBe(returnTo);
  });

  it("rejects external, lookalike, over-limit, and malformed return paths", () => {
    for (const value of [
      "https://example.com/",
      "//example.com/compare-majors",
      "/compare-majors-elsewhere",
      "/compare-majors?majors=1,2,3,4,5",
      "/compare-majors?majors=1,nope",
    ]) {
      expect(isValidComparisonReturnTo(value)).toBe(false);
    }
  });

  it("keeps an ordered valid career list in a comparison URL", () => {
    expect(
      buildCareerComparisonHref({ careerIds: [12, 34, 56], processId: "9", modalityId: "1" }),
    ).toBe("/compare-majors?majors=12%2C34%2C56&process=9&modality=1");
  });
});
