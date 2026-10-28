import { describe, expect, it } from "vitest";

import { buildCareerComparisonHref, parseCareerComparisonUrl } from "./careerComparisonUrl";

describe("career comparison URL state", () => {
  it("keeps ordered unique positive ids and identifies malformed and excessive selections", () => {
    const state = parseCareerComparisonUrl("?careers=12,12,0,bad,34,56,78,90");
    expect(state.careerIds).toEqual([12, 34, 56, 78, 90]);
    expect(state.malformedCareerIds).toEqual(["0", "bad"]);
    expect(state.tooManyCareers).toBe(true);
  });

  it("recovers unsupported metrics to admission rate", () => {
    expect(parseCareerComparisonUrl("?metric=unknown")).toMatchObject({
      metric: "admission_rate",
      invalidMetric: true,
    });
    expect(parseCareerComparisonUrl("").invalidMetric).toBe(false);
  });

  it("builds a shareable URL while omitting defaults", () => {
    expect(
      buildCareerComparisonHref({
        careerIds: [12, 34],
        processId: "9",
        modalityId: "1",
        metric: "admission_rate",
      }),
    ).toBe("/comparar-carreras?careers=12%2C34&process=9&modality=1");
  });
});
