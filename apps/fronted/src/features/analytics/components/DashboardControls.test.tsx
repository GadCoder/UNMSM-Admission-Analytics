import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdmissionProcess } from "../api/analytics.types";
import { DashboardControls } from "./DashboardControls";

const processes: AdmissionProcess[] = [
  { id: 4, year: 2026, sequence: "26-2", name: "" },
  { id: 3, year: 2026, sequence: "26-1", name: "" },
  { id: 2, year: 2025, sequence: "25-2", name: "" },
  { id: 1, year: 2025, sequence: "25-1", name: "" },
];

describe("DashboardControls process selector", () => {
  afterEach(cleanup);

  it("lists all processes and reports a changed selection without comparison controls", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DashboardControls processes={processes} primaryId="4" onChange={onChange} />);
    const selector = screen.getByRole("combobox", { name: "Proceso analizado" });
    expect(within(selector).getAllByRole("option")).toHaveLength(4);
    expect(selector).toHaveValue("4");
    await user.selectOptions(selector, "2");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("2");
    expect(screen.queryByRole("button", { name: /comparar/i })).not.toBeInTheDocument();
  });

  it("reflects a process selected elsewhere in the page", () => {
    const { rerender } = render(<DashboardControls processes={processes} primaryId="4" onChange={vi.fn()} />);
    rerender(<DashboardControls processes={processes} primaryId="1" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Proceso analizado")).toHaveValue("1");
  });
});
