import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "./App";

const modalities = [
  { id: 1, name: "EBR" },
  { id: 2, name: "Especial" },
];

function renderWithCatalog(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryDefaults(["modalities"], { staleTime: Infinity });
  client.setQueryData(["modalities"], modalities);
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("App shell", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });
  it("renders process heading, logo, and process tab on the home route", () => {
    renderWithCatalog(
      <MemoryRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<div>Process page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resultados de admisión" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "UNMSM" })).toHaveAttribute(
      "src",
      "https://assets.resultados-unmsm.com/brand/unmsm-2e787805.png",
    );
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resultados por proceso" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("preserves process and modality when switching between process and career routes", () => {
    renderWithCatalog(
      <MemoryRouter initialEntries={["/?process=12&modality=1&faculty=99&academic_area=7"]}>
        <Routes>
          <Route element={<App />}>
            <Route index element={<div>Process page</div>} />
            <Route path="carreras" element={<div>Career discovery</div>} />
            <Route path="carreras/:majorId" element={<div>Career detail</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Explorar carreras" })).toHaveAttribute(
      "href",
      "/carreras?process=12&modality=1",
    );
  });

  it("marks careers active on a directly opened career detail and avoids a duplicate h1", () => {
    renderWithCatalog(
      <MemoryRouter initialEntries={["/carreras/42?process=12&modality=1&faculty=99"]}>
        <Routes>
          <Route element={<App />}>
            <Route path="carreras/:majorId" element={<h1>Ingeniería de Sistemas</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Explorar carreras" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Explorar carreras" })).toHaveAttribute(
      "href",
      "/carreras?process=12&modality=1&faculty=99",
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByText(
        "Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the process page's session-backed modality when opening careers", () => {
    sessionStorage.setItem(
      "unmsm-dashboard-view",
      JSON.stringify({ filters: { academicArea: "ING", faculty: "SIS", modality: "Especial" } }),
    );
    renderWithCatalog(
      <MemoryRouter initialEntries={["/?process=12"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Explorar carreras" })).toHaveAttribute(
      "href",
      "/carreras?process=12&modality=2",
    );
  });

  it("leaves the discovery page as the sole primary heading", () => {
    renderWithCatalog(
      <MemoryRouter initialEntries={["/carreras"]}>
        <Routes>
          <Route element={<App />}>
            <Route path="carreras" element={<h1>Encuentra tu carrera</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("preserves comparison context in primary navigation without adding a duplicate heading", () => {
    renderWithCatalog(
      <MemoryRouter
        initialEntries={[
          "/comparar-carreras?careers=11,22&process=9&modality=1&metric=highest_score",
        ]}
      >
        <Routes>
          <Route element={<App />}>
            <Route path="comparar-carreras" element={<h1>Compara carreras</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Comparar carreras" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Comparar carreras" })).toHaveAttribute(
      "href",
      "/comparar-carreras?process=9&modality=1&careers=11%2C22&metric=highest_score",
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
