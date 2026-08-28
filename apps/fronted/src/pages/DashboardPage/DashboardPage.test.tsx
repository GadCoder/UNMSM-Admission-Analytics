import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardPage } from "./DashboardPage";
import * as api from "../../shared/api/analytics";

vi.mock("../../shared/api/analytics");

const processes = [
  { id: 1, year: 2025, sequence: 2, name: "Proceso 2025-II" },
  { id: 2, year: 2025, sequence: 1, name: "Proceso 2025-I" },
];
const overview = { processes: [{ process: processes[0], total_results: 100, admitted_count: 20, absent_count: 10, average_score: "65.5", highest_score: "98.0", majors: [{ major_id: 1, major_code: "ING", major_name: "Ingeniería", total_results: 50, admitted_count: 12, absent_count: 5, average_score: "70" }] }] };
function LocationProbe() { const location = useLocation(); return <output data-testid="location">{location.search}</output>; }
function renderPage(entry = "/") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[entry]}><DashboardPage /><LocationProbe /></MemoryRouter></QueryClientProvider>);
}

describe("DashboardPage", () => {
  beforeEach(() => {
    cleanup();
    vi.mocked(api.getPublishedProcesses).mockResolvedValue(processes);
    vi.mocked(api.getAnalyticsOverview).mockResolvedValue(overview);
  });
  it("defaults to latest process and renders KPIs", async () => {
    renderPage();
    expect(await screen.findByText("Proceso 2025-II")).toBeInTheDocument();
    expect(await screen.findByText("100")).toBeInTheDocument();
    expect(screen.getByText("65.5")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
  it("updates URL when a comparison is selected", async () => {
    renderPage();
    await screen.findByRole("table");
    await userEvent.selectOptions(screen.getByDisplayValue("Proceso 2025-II"), "2");
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("process=2"));
  });
  it("shows loading and error states", async () => {
    vi.mocked(api.getPublishedProcesses).mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    cleanup();
    vi.mocked(api.getPublishedProcesses).mockRejectedValueOnce(new Error("offline"));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(/no pudimos/i);
  });
});
