import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import type { ComponentProps } from "react";
import type { ProcessOverview } from "../api/analytics.types";
import { CareerDiscovery } from "./CareerDiscovery";

const overview: ProcessOverview = {
  process: { id: 24, year: 2026, sequence: "1", name: "2026-1" }, total_results: 1000, admitted_count: 100,
  absent_count: 20, average_score: "70", highest_score: "100",
  majors: [
    { major_id: 1, major_code: "MED", major_name: "Medicina Humana", total_results: 500, admitted_count: 50, absent_count: 0, average_score: "80" },
    { major_id: 2, major_code: "DER", major_name: "Derecho", total_results: 300, admitted_count: 30, absent_count: 0, average_score: "70" },
    { major_id: 3, major_code: "ING", major_name: "Ingeniería de Sistemas", total_results: 200, admitted_count: 20, absent_count: 0, average_score: "60" },
    { major_id: 4, major_code: "ODO", major_name: "Odontología", total_results: 100, admitted_count: 10, absent_count: 0, average_score: "60" },
  ],
};

function Location() { const location = useLocation(); return <output data-testid="location" data-state={JSON.stringify(location.state)}>{location.pathname}{location.search}</output>; }
function setup(overrides: Partial<ComponentProps<typeof CareerDiscovery>> = {}) {
  const onQueryChange = vi.fn();
  const onShowAllChange = vi.fn();
  const props = { overview, processId: "24", navigation: { modalityId: "7" }, query: "", onQueryChange, showAll: false, onShowAllChange, ...overrides };
  render(<MemoryRouter><Routes><Route path="*" element={<><CareerDiscovery {...props} /><Location /></>} /></Routes></MemoryRouter>);
  return { onQueryChange, onShowAllChange, props };
}

describe("CareerDiscovery", () => {
  afterEach(cleanup);

  it("shows three popular choices, then exposes every career and navigates with context", async () => {
    const user = userEvent.setup();
    const { onShowAllChange } = setup();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Carreras con más postulantes" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver todas las carreras" }));
    expect(onShowAllChange).toHaveBeenCalledWith(true);
    cleanup();
    setup({ showAll: true });
    expect(screen.getAllByRole("list").at(-1)).toHaveTextContent("Odontología");
    await user.click(screen.getAllByRole("link", { name: /Medicina Humana/ })[0]);
    expect(screen.getByTestId("location")).toHaveTextContent("/carreras/1?process=24&modality=7");
    expect(screen.getByTestId("location")).toHaveAttribute("data-state", JSON.stringify({ fromDiscovery: true }));
  });

  it("searches without accents, reflects external query changes and supports keyboard selection", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = setup({ query: "Medicina" });
    const input = screen.getByRole("searchbox", { name: "Busca tu carrera" });
    const results = screen.getByRole("list", { name: "Carreras coincidentes" });
    expect(within(results).getByRole("link", { name: /Medicina Humana/ })).toHaveAttribute("href", expect.stringContaining("/carreras/1"));
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    const firstResult = within(results).getByRole("link", { name: /Medicina Humana/ });
    expect(firstResult).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("location")).toHaveTextContent("/carreras/1");
    expect(screen.getByTestId("location")).toHaveAttribute("data-state", JSON.stringify({ fromDiscovery: true }));
    expect(onQueryChange).not.toHaveBeenCalled();

    cleanup();
    setup({ query: "ingenieria sistemas" });
    const multiWordResults = screen.getByRole("list", { name: "Carreras coincidentes" });
    expect(within(multiWordResults).getByRole("link", { name: /Ingeniería de Sistemas/ })).toBeInTheDocument();
  });

  it("clears search and presents loading/error retry states", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = setup({ query: "inexistente" });
    expect(screen.getByText("No encontramos carreras con ese nombre.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(onQueryChange).toHaveBeenCalledWith("");

    cleanup();
    setup({ status: "loading" });
    expect(screen.getByText("Cargando carreras…")).toHaveAttribute("role", "status");
    cleanup();
    const onRetry = vi.fn();
    setup({ status: "error", onRetry });
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar las carreras.");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("uses arrows to focus result links and Escape returns focus to search", async () => {
    const user = userEvent.setup();
    setup({ query: "ingen" });
    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    const result = screen.getByRole("link", { name: /Ingeniería de Sistemas/ });
    expect(result).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(input).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(result).toHaveFocus();
  });
});
