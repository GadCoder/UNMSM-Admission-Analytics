import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App shell", () => {
  it("renders the results heading and logo in the top bar", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resultados de admisión" })).toBeInTheDocument();
    expect(screen.getByText("Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "UNMSM" })).toHaveAttribute("src", "https://assets.resultados-unmsm.com/brand/unmsm-2e787805.png");
    expect(screen.queryByRole("navigation", { name: "Navegación principal" })).not.toBeInTheDocument();
  });
});
