import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App shell", () => {
  it("renders the product identity without competing top-level tabs", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Admisión UNMSM")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Navegación principal" })).not.toBeInTheDocument();
  });

  it("serves the topbar logo from the Cloudflare asset domain", () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(within(container).getByRole("img", { name: "UNMSM" })).toHaveAttribute(
      "src",
      "https://assets.resultados-unmsm.com/brand/unmsm-2e787805.png",
    );
  });
});
