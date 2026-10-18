import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './ResponsiveControlPanel.module.css';

export interface ResponsiveControlPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'compact' | 'wide';
}

const OPEN_EVENT = 'analytics-control-panel-open';
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useMobilePresentation() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 600px)').matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(max-width: 600px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return mobile;
}

export function ResponsiveControlPanel({
  open,
  onClose,
  title,
  triggerRef,
  children,
  footer,
  size = 'wide',
}: ResponsiveControlPanelProps) {
  const mobile = useMobilePresentation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<object>({});
  const wasOpenRef = useRef(false);
  const suppressRestoreRef = useRef(false);
  const closeRef = useRef(onClose);
  const titleId = useId();

  useLayoutEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  const restoreFocus = useCallback(() => {
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    const signalOpen = (event: Event) => {
      if ((event as CustomEvent<object>).detail !== instanceRef.current) {
        suppressRestoreRef.current = true;
        closeRef.current();
      }
    };
    window.addEventListener(OPEN_EVENT, signalOpen);
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: instanceRef.current }));
    return () => window.removeEventListener(OPEN_EVENT, signalOpen);
  }, [open]);

  useLayoutEffect(() => {
    if (!mobile || !open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // jsdom and older browsers do not implement showModal.
        dialog.setAttribute('open', '');
      }
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTarget = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (focusTarget ?? dialog)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog?.open && typeof dialog.close === 'function') dialog.close();
      else dialog?.removeAttribute('open');
    };
  }, [mobile, open]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!open || mobile || !panel) return;
    const position = () => {
      panel.style.transform = '';
      const rect = panel.getBoundingClientRect();
      const dx = Math.max(8 - rect.left, Math.min(0, window.innerWidth - 8 - rect.right));
      const dy = Math.max(8 - rect.top, Math.min(0, window.innerHeight - 8 - rect.bottom));
      panel.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      panel.style.transform = '';
    };
  }, [open, mobile]);

  useEffect(() => {
    if (!open || mobile) return;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const node = panelRef.current;
      if (node && !node.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        suppressRestoreRef.current = true;
        closeRef.current();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        suppressRestoreRef.current = true;
        closeRef.current();
        restoreFocus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, mobile, restoreFocus, triggerRef]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      suppressRestoreRef.current = false;
      return;
    }
    if (wasOpenRef.current && !suppressRestoreRef.current) restoreFocus();
    wasOpenRef.current = false;
    suppressRestoreRef.current = false;
  }, [open, restoreFocus]);

  if (!open) return null;

  const close = () => {
    suppressRestoreRef.current = true;
    onClose();
    restoreFocus();
  };

  if (mobile) {
    return createPortal(
      <dialog
        ref={dialogRef}
        className={`${styles.sheet} ${size === 'compact' ? styles.compact : ''}`}
        aria-labelledby={titleId}
        aria-modal="true"
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClick={(event) => { if (event.target === dialogRef.current) close(); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { event.preventDefault(); close(); return; }
          if (event.key !== 'Tab') return;
          const dialog = dialogRef.current;
          const items = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE);
          if (!items?.length) { event.preventDefault(); dialog?.focus(); return; }
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
      >
        <div className={styles.sheetContent}>
          <header className={styles.header}>
            <h2 id={titleId}>{title}</h2>
            <button className={styles.close} type="button" aria-label="Cerrar" onClick={close}>×</button>
          </header>
          <div className={styles.body}>{children}</div>
          {footer != null && <div className={styles.footer}>{footer}</div>}
        </div>
      </dialog>,
      document.body,
    );
  }

  return (
    <div ref={panelRef} className={`${styles.popover} ${size === 'compact' ? styles.compact : ''}`} role="dialog" aria-modal="false" aria-label={title}>
      <header className={styles.desktopHeader}>
        <h2 id={titleId}>{title}</h2>
        <button className={styles.close} type="button" aria-label="Cerrar" onClick={close}>×</button>
      </header>
      <div className={styles.body}>{children}</div>
      {footer != null && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}

export default ResponsiveControlPanel;
