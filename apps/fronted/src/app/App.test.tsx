import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App shell", () => {
  it("renders the product identity and primary navigation", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Admisión UNMSM")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Postulantes" })).toHaveAttribute("href", "/resultados");
  });
});
