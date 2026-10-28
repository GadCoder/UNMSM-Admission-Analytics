import { useRef, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponsiveControlPanel } from "./ResponsiveControlPanel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setupPanel(initialMobile = false) {
  let isMobile = initialMobile;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return isMobile;
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
  function Harness() {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    return (
      <>
        <button ref={triggerRef} onClick={() => setOpen(true)}>
          Open panel
        </button>
        <button>Outside</button>
        <div style={{ position: "relative" }}>
          <ResponsiveControlPanel
            open={open}
            onClose={() => setOpen(false)}
            title="Panel title"
            triggerRef={triggerRef}
            footer={<button>Apply</button>}
          >
            <button>First choice</button>
            <button>Last choice</button>
          </ResponsiveControlPanel>
        </div>
      </>
    );
  }
  const view = render(<Harness />);
  return {
    ...view,
    changeBreakpoint(mobile: boolean) {
      isMobile = mobile;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

describe("ResponsiveControlPanel", () => {
  it("dismisses the desktop popover on Escape and restores trigger focus", async () => {
    setupPanel();
    const trigger = screen.getByRole("button", { name: "Open panel" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Panel title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Panel title" })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("dismisses desktop popover on outside pointer without stealing new control focus", async () => {
    setupPanel();
    fireEvent.click(screen.getByRole("button", { name: "Open panel" }));
    const outside = screen.getByRole("button", { name: "Outside" });
    fireEvent.pointerDown(outside);
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Panel title" })).not.toBeInTheDocument(),
    );
    outside.focus();
    expect(outside).toHaveFocus();
  });

  it("uses a modal sheet on mobile and restores body scrolling and focus on close", async () => {
    setupPanel(true);
    const trigger = screen.getByRole("button", { name: "Open panel" });
    fireEvent.click(trigger);
    const sheet = screen.getByRole("dialog", { name: "Panel title" });
    expect(sheet).toHaveAttribute("open");
    expect(sheet).toHaveAttribute("aria-modal", "true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar" }), {
      key: "Tab",
      shiftKey: true,
    });
    expect(screen.getByRole("button", { name: "Apply" })).toHaveFocus();
    fireEvent.keyDown(sheet, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Panel title" })).not.toBeInTheDocument(),
    );
    expect(document.body.style.overflow).toBe("");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("switches presentation at the breakpoint without closing the shared panel", () => {
    const view = setupPanel();
    fireEvent.click(screen.getByRole("button", { name: "Open panel" }));
    view.changeBreakpoint(true);
    expect(screen.getByRole("dialog", { name: "Panel title" })).toHaveAttribute("open");
    expect(document.body.style.overflow).toBe("hidden");
    view.changeBreakpoint(false);
    expect(screen.getByRole("dialog", { name: "Panel title" })).toHaveAttribute(
      "aria-modal",
      "false",
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps focus in the newly opened panel when another panel closes", async () => {
    function TwoPanels() {
      const [firstOpen, setFirstOpen] = useState(false);
      const [secondOpen, setSecondOpen] = useState(false);
      const firstTrigger = useRef<HTMLButtonElement>(null);
      const secondTrigger = useRef<HTMLButtonElement>(null);
      return (
        <>
          <div style={{ position: "relative" }}>
            <button ref={firstTrigger} onClick={() => setFirstOpen(true)}>
              Compare
            </button>
            <ResponsiveControlPanel
              open={firstOpen}
              onClose={() => setFirstOpen(false)}
              title="Compare"
              triggerRef={firstTrigger}
            >
              <button>Compare choice</button>
            </ResponsiveControlPanel>
          </div>
          <div style={{ position: "relative" }}>
            <button ref={secondTrigger} onClick={() => setSecondOpen(true)}>
              Filters
            </button>
            <ResponsiveControlPanel
              open={secondOpen}
              onClose={() => setSecondOpen(false)}
              title="Filters"
              triggerRef={secondTrigger}
            >
              <button>Filter choice</button>
            </ResponsiveControlPanel>
          </div>
        </>
      );
    }
    render(<TwoPanels />);
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Compare" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog", { name: "Filters" })).toContainElement(
      document.activeElement as HTMLElement,
    );
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
  });
});
