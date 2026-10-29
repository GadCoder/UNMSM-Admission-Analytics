import { expect, it } from "vitest";
import { navigationAttributes } from "./navigation";

it("captures public route parameters while excluding arbitrary text and nested URLs", () => {
  expect(
    navigationAttributes(
      "/majors/54",
      "?process=7&modality=1&q=private&returnTo=/secret&token=secret",
    ),
  ).toEqual({
    path: "/majors/:id",
    major_id: "54",
    query_process: "7",
    query_modality: "1",
  });
  expect(
    navigationAttributes("/unknown/private", "?process=secret&majors=1,2,3,4,5&faculty=private"),
  ).toEqual({});
});
