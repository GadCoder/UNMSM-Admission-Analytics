import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ADMISSION_MODALITY } from "../utils/admissionModality";
import { DashboardFilterControls, type DashboardFilters } from "./DashboardFilterControls";

vi.mock("./ResponsiveControlPanel", () => ({
  ResponsiveControlPanel: ({
    open,
    onClose,
    title,
    children,
    footer,
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    open ? (
      <section aria-label={title}>
        <button type="button" onClick={onClose}>
          Cerrar panel
        </button>
        {children}
        {footer}
      </section>
    ) : null,
}));

const areas = [
  { id: 1, code: "A", name: "Área A" },
  { id: 2, code: "B", name: "Área B" },
];
const faculties = [
  { id: 1, code: "FA", name: "Facultad A", academic_area_id: 1 },
  { id: 2, code: "FB", name: "Facultad B", academic_area_id: 2 },
];
const blank: DashboardFilters = {
  academicArea: "",
  faculty: "",
  modality: DEFAULT_ADMISSION_MODALITY,
};
const props = (overrides: Partial<React.ComponentProps<typeof DashboardFilterControls>> = {}) => ({
  areas,
  faculties,
  filters: blank,
  onChange: vi.fn(),
  onReset: vi.fn(),
  ...overrides,
});

describe("DashboardFilterControls", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("keeps the edited draft when the panel closes and reopens before debounce", () => {
    const onChange = vi.fn();
    render(<DashboardFilterControls {...props({ onChange })} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir filtros de carreras" }));
    fireEvent.change(screen.getByLabelText("Área académica"), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar panel" }));
    fireEvent.click(screen.getByRole("button", { name: "Abrir filtros de carreras" }));

    expect(screen.getByLabelText("Área académica")).toHaveValue("A");
    vi.advanceTimersByTime(400);
    expect(onChange).toHaveBeenCalledWith({ ...blank, academicArea: "A" });
  });

  it("cancels a pending edit and adopts an external filter update", () => {
    const onChange = vi.fn();
    const initial = props({ onChange });
    const view = render(<DashboardFilterControls {...initial} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir filtros de carreras" }));
    fireEvent.change(screen.getByLabelText("Área académica"), { target: { value: "A" } });

    const external = { ...blank, academicArea: "B", faculty: "FB" };
    view.rerender(<DashboardFilterControls {...initial} filters={external} />);
    expect(screen.getByLabelText("Área académica")).toHaveValue("B");
    expect(screen.getByLabelText("Facultad")).toHaveValue("FB");
    vi.advanceTimersByTime(400);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancels a pending draft when reset is requested", () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(<DashboardFilterControls {...props({ onChange, onReset })} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir filtros de carreras" }));
    fireEvent.change(screen.getByLabelText("Área académica"), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: "↻ Restablecer filtros" }));
    vi.advanceTimersByTime(400);

    expect(onReset).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Filtrar resultados")).not.toBeInTheDocument();
  });
});
