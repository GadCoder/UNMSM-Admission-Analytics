import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MajorDetailProcess } from "../api/analytics.types";
import { MajorDetailHistory } from "./MajorDetailHistory";

function process(id: number, year: number, sequence: string, total: number, admitted: number): MajorDetailProcess {
  return { process: { id, year, sequence, name: "" }, total_results: total, admitted_count: admitted, absent_count: 4, average_score: "75.25", highest_score: "90.50" };
}

describe("MajorDetailHistory", () => {
  afterEach(cleanup);

  it("explains a change using the preceding process, groups years and keeps every result visible", () => {
    render(<MajorDetailHistory items={[
      process(3, 2026, "26-2", 150, 15),
      process(2, 2026, "26-1", 100, 20),
      process(1, 2025, "25-2", 80, 10),
    ]} selectedProcessId={3} />);
    const timeline = screen.getByRole("list", { name: "Historial por proceso" });
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(3);
    expect(within(timeline).getAllByRole("button").map(button => button.textContent)).toEqual(["2026-2", "2026-1", "2025-2"]);
    expect(screen.getAllByRole("heading", { name: "2026" })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "2025" })).toBeInTheDocument();
    const latest = screen.getByRole("article", { name: "Proceso 2026-2" });
    expect(within(latest).getByRole("heading", { name: "Hubo más postulantes y menos ingresantes que en 2026-1." })).toBeInTheDocument();
    expect(latest).toHaveTextContent("150 postulantes · 15 ingresantes");
    expect(latest).toHaveTextContent("Los ingresantes disminuyeron un 25%, mientras que los postulantes aumentaron un 50% respecto a 2026-1.");
    expect(latest).toHaveTextContent("Ingresó el 10% de los postulantes, frente al 20% en 2026-1.");
    expect(latest).toHaveTextContent("Puntaje promedio75.25");
    expect(latest).toHaveTextContent("Puntaje máximo90.5");
    expect(latest).toHaveTextContent("Ausentes4 (2.7%)");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /detalles/i })).not.toBeInTheDocument();
  });

  it("quantifies changes even when the heading describes applicants as similar", () => {
    render(<MajorDetailHistory items={[
      process(2, 2026, "26-2", 1046, 389),
      process(1, 2026, "26-1", 1000, 200),
    ]} />);
    const latest = screen.getByRole("article", { name: "Proceso 2026-2" });
    expect(within(latest).getByRole("heading", { name: "Hubo más ingresantes que en 2026-1, con una cantidad similar de postulantes." })).toBeInTheDocument();
    expect(latest).toHaveTextContent("Los ingresantes aumentaron un 94.5%, mientras que los postulantes aumentaron un 4.6% respecto a 2026-1.");
    expect(screen.getByRole("article", { name: "Proceso 2026-1" })).not.toHaveTextContent("mientras que");
  });

  it("distinguishes unchanged counts from a small change that rounds to zero", () => {
    render(<MajorDetailHistory items={[
      process(2, 2026, "26-2", 10001, 200),
      process(1, 2026, "26-1", 10000, 200),
    ]} />);
    const latest = screen.getByRole("article", { name: "Proceso 2026-2" });
    expect(latest).toHaveTextContent("Los ingresantes no variaron, mientras que los postulantes aumentaron menos del 0.1% respecto a 2026-1.");
  });

  it.each([
    [105, 21, "La participación y el ingreso fueron similares a los de 2025-2."],
    [106, 21, "Hubo más postulantes que en 2025-2, con una cantidad similar de ingresantes."],
    [90, 25, "Hubo menos postulantes y más ingresantes que en 2025-2."],
    [120, 25, "Hubo más postulantes y más ingresantes que en 2025-2."],
    [90, 15, "Hubo menos postulantes y menos ingresantes que en 2025-2."],
    [100, 0, "Hubo menos ingresantes que en 2025-2, con una cantidad similar de postulantes."],
  ])("uses a consistent similarity threshold for %i applicants and %i admitted", (total, admitted, title) => {
    render(<MajorDetailHistory items={[process(2, 2026, "26-1", total, admitted), process(1, 2025, "25-2", 100, 20)]} />);
    expect(within(screen.getByRole("article", { name: "Proceso 2026-1" })).getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it("does not invent a rate or comparison when there are no applicants or missing scores", () => {
    const empty = { ...process(1, 2025, "25-2", 0, 0), absent_count: 0, average_score: null, highest_score: null };
    render(<MajorDetailHistory items={[process(2, 2026, "26-1", 100, 20), empty]} />);
    const latest = screen.getByRole("article", { name: "Proceso 2026-1" });
    expect(latest).toHaveTextContent("Referencia de participación e ingreso");
    expect(within(latest).queryByText(/Respecto al proceso/)).not.toBeInTheDocument();
    expect(latest).toHaveTextContent("Ingresó el 20% de los postulantes.");
    expect(latest).not.toHaveTextContent("frente al");
    expect(latest).toHaveTextContent("El proceso anterior no tiene postulantes para comparar.");
    const oldest = screen.getByRole("article", { name: "Proceso 2025-2" });
    expect(oldest).toHaveTextContent("Sin postulantes registrados");
    expect(oldest).toHaveTextContent("No hay una tasa de ingreso calculable");
    expect(oldest).toHaveTextContent("Puntaje promedio—");
    expect(oldest).not.toHaveTextContent("0%");
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it("compares admitted counts from a zero baseline without dividing by zero", () => {
    render(<MajorDetailHistory items={[process(2, 2026, "26-1", 100, 10), process(1, 2025, "25-2", 100, 0)]} />);
    const latest = screen.getByRole("article", { name: "Proceso 2026-1" });
    expect(latest).toHaveTextContent("Hubo más ingresantes que en 2025-2, con una cantidad similar de postulantes.");
    expect(latest).toHaveTextContent("Los ingresantes pasaron de 0 a 10, mientras que los postulantes no variaron respecto a 2025-2.");
    expect(latest).toHaveTextContent("frente al 0% en 2025-2.");
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it("shows a factual reference for a single process and preserves keyboard selection", async () => {
    const select = vi.fn();
    const user = userEvent.setup();
    render(<MajorDetailHistory items={[process(1, 2025, "25-2", 100, 20)]} selectedProcessId={1} onSelectProcess={select} />);
    expect(screen.getByRole("heading", { name: "Referencia de participación e ingreso" })).toBeInTheDocument();
    expect(screen.getByText("Proceso analizado")).toBeInTheDocument();
    expect(screen.getByText("Primer proceso disponible; sin comparación anterior.")).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole("button", { name: "2025-2" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(select).toHaveBeenCalledWith(1);
    expect(screen.getByRole("button", { name: "2025-2" })).toHaveAttribute("aria-pressed", "true");
  });

  it("handles empty history", () => {
    render(<MajorDetailHistory items={[]} />);
    expect(screen.getByText("No hay resultados históricos disponibles para esta carrera.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
