import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdmissionProcess } from "../api/analytics.types";
import { DashboardControls } from "./DashboardControls";

vi.mock("./ResponsiveControlPanel", () => ({
  ResponsiveControlPanel: ({ open, title, children, footer, onClose }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) => open
    ? <section role="dialog" aria-label={title}><button type="button" aria-label="Cerrar" onClick={onClose}>×</button>{children}{footer}</section>
    : null,
}));

const processes: AdmissionProcess[] = [
  { id: 4, year: 2026, sequence: "26-2", name: "" },
  { id: 3, year: 2026, sequence: "26-1", name: "" },
  { id: 2, year: 2025, sequence: "25-2", name: "" },
  { id: 1, year: 2025, sequence: "25-1", name: "" },
];

describe("DashboardControls comparisons", () => {
  afterEach(cleanup);

  it("discards draft changes on close and commits selected comparisons in process order", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<DashboardControls processes={processes} primaryId="4" comparisons={["2"]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Editar comparaciones: 2025-2" }));
    const dialog = screen.getByRole("dialog", { name: "Comparar con" });
    await user.click(within(dialog).getByLabelText("2026-1"));
    await user.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Editar comparaciones: 2025-2" }));
    const reopened = screen.getByRole("dialog", { name: "Comparar con" });
    expect(within(reopened).getByLabelText("2026-1")).not.toBeChecked();
    await user.click(within(reopened).getByLabelText("2026-1"));
    await user.click(within(reopened).getByRole("button", { name: "Aplicar comparación" }));
    expect(onChange).toHaveBeenCalledWith("4", ["3", "2"]);
    rerender(<DashboardControls processes={processes} primaryId="4" comparisons={["3", "2"]} onChange={onChange} />);
    expect(screen.getByRole("list", { name: "Procesos en comparación" }).textContent).toContain("vs. 2026-1");
  });

  it("limits drafts to three additional processes and excludes the primary process", async () => {
    const user = userEvent.setup();
    render(<DashboardControls processes={processes} primaryId="4" comparisons={[]} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Añadir proceso para comparar" }));
    const dialog = screen.getByRole("dialog", { name: "Comparar con" });
    expect(within(dialog).queryByLabelText("2026-2")).not.toBeInTheDocument();
    for (const label of ["2026-1", "2025-2", "2025-1"]) await user.click(within(dialog).getByLabelText(label));
    expect(within(dialog).getByRole("status", { name: "3 de 3 seleccionados" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("2026-1")).toBeChecked();
  });

  it("keeps an open draft when the parent recreates unchanged comparison arrays", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<DashboardControls processes={processes} primaryId="4" comparisons={["2"]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Editar comparaciones: 2025-2" }));
    const dialog = screen.getByRole("dialog", { name: "Comparar con" });
    await user.click(within(dialog).getByLabelText("2026-1"));
    rerender(<DashboardControls processes={[...processes]} primaryId="4" comparisons={["2"]} onChange={onChange} />);
    expect(within(screen.getByRole("dialog", { name: "Comparar con" })).getByLabelText("2026-1")).toBeChecked();
  });
  it("disables empty initial Apply but allows clearing an active comparison", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<DashboardControls processes={processes} primaryId="4" comparisons={[]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Añadir proceso para comparar" }));
    const apply = screen.getByRole("button", { name: "Aplicar comparación" });
    expect(apply).toBeDisabled();
    await user.click(apply);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByLabelText("2026-1"));
    expect(apply).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    rerender(<DashboardControls processes={processes} primaryId="4" comparisons={["3"]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Editar comparaciones: 2026-1" }));
    await user.click(screen.getByLabelText("2026-1"));
    expect(screen.getByRole("button", { name: "Aplicar comparación" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Aplicar comparación" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("4", []);
  });

  it("discards unapplied edits on close and restores the applied values on reopen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DashboardControls processes={processes} primaryId="4" comparisons={["3"]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Editar comparaciones: 2026-1" }));
    await user.click(screen.getByLabelText("2026-1"));
    await user.click(screen.getByLabelText("2025-2"));
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Editar comparaciones: 2026-1" }));
    expect(screen.getByLabelText("2026-1")).toBeChecked();
    expect(screen.getByLabelText("2025-2")).not.toBeChecked();
  });

  it("toggles comparisons from the process name and the surrounding row", async () => {
    const user = userEvent.setup();
    render(<DashboardControls processes={processes} primaryId="4" comparisons={[]} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Añadir proceso para comparar" }));
    const checkbox = screen.getByRole("checkbox", { name: "2026-1" });
    await user.click(screen.getByText("2026-1", { selector: "span" }));
    expect(checkbox).toBeChecked();
    await user.click(checkbox.closest("label")!);
    expect(checkbox).not.toBeChecked();
  });

});
