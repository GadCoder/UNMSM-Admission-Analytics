import { type ReactNode, useRef, useState } from "react";

import { ResponsiveControlPanel } from "./ResponsiveControlPanel";
import styles from "./ResponsiveFilterControls.module.css";

export type ResponsiveFilterControlsProps = {
  label: string;
  title: string;
  triggerLabel?: string;
  activeCount?: number;
  className?: string;
  desktopContent: ReactNode;
  children: ReactNode;
  footer?: ReactNode | ((close: () => void) => ReactNode);
};

/** Shared responsive filter trigger and panel used by analytics pages. */
export function ResponsiveFilterControls({
  label,
  title,
  triggerLabel = "Abrir filtros",
  activeCount = 0,
  className,
  desktopContent,
  children,
  footer,
}: ResponsiveFilterControlsProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const activeText = activeCount > 0 ? ` (${activeCount})` : "";
  const close = () => setOpen(false);

  return (
    <div
      className={[styles.wrapper, className].filter(Boolean).join(" ")}
      role="group"
      aria-label={label}
    >
      {!open && <div className={styles.desktopContent}>{desktopContent}</div>}
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          activeCount > 0
            ? `${triggerLabel}, ${activeCount} ${activeCount === 1 ? "filtro activo" : "filtros activos"}`
            : triggerLabel
        }
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16M7 12h10m-7 7h4" />
        </svg>
        <span>Filtros{activeText}</span>
      </button>
      <ResponsiveControlPanel
        open={open}
        onClose={close}
        title={title}
        triggerRef={triggerRef}
        footer={typeof footer === "function" ? footer(close) : footer}
      >
        {children}
      </ResponsiveControlPanel>
    </div>
  );
}
