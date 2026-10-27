import { useId, type KeyboardEvent, type RefObject } from "react";

import styles from "./CareerDiscovery.module.css";

type CareerSearchProps = {
  query: string;
  status: "ready" | "loading" | "error";
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onRetry?: () => void;
  label?: string;
  inputId?: string;
};

export function CareerSearch({ query, status, inputRef, onQueryChange, onKeyDown, onRetry, label = "Busca tu carrera", inputId }: CareerSearchProps) {
  const generatedId = useId();
  const searchId = inputId ?? generatedId;
  return <div className={styles.searchWrap}>
    <label className={styles.searchLabel} htmlFor={searchId}>{label}</label>
    <div className={styles.searchBox}>
      <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
      <input ref={inputRef} id={searchId} type="search" autoComplete="off" value={query} placeholder="Medicina, Derecho, Ingeniería…" disabled={status !== "ready"}
        onChange={(event) => onQueryChange(event.target.value)} onKeyDown={onKeyDown} />
      {query && <button className={styles.clear} type="button" aria-label="Limpiar búsqueda" onClick={() => { onQueryChange(""); inputRef.current?.focus(); }}>×</button>}
    </div>
    {status === "loading" && <p className={styles.searchStatus} role="status">Cargando carreras…</p>}
    {status === "error" && <div className={styles.searchStatus} role="alert"><span>No pudimos cargar las carreras.</span>{onRetry && <button type="button" onClick={onRetry}>Reintentar</button>}</div>}
  </div>;
}
