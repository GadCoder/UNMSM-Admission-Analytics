import { useMemo, useRef, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";

import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { careerDetailHref } from "../utils/admissionModality";
import styles from "./CareerDiscovery.module.css";

export type CareerDiscoveryProps = {
  overview?: ProcessOverview;
  processId: string;
  modality: string;
  returnTo: string;
  query: string;
  onQueryChange: (query: string) => void;
  showAll: boolean;
  onShowAllChange: (showAll: boolean) => void;
  status?: "ready" | "loading" | "error";
  onRetry?: () => void;
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
const rate = (admitted: number, applicants: number) => applicants > 0 ? `${formatNumber(admitted / applicants * 100, 1)}%` : "No disponible";

export function CareerDiscovery({ overview, processId, modality, returnTo, query, onQueryChange, showAll, onShowAllChange, status = "ready", onRetry }: CareerDiscoveryProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultLinkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const majors = useMemo(() => [...(overview?.majors ?? [])].sort((a, b) =>
    b.total_results - a.total_results || a.major_name.localeCompare(b.major_name, "es") || a.major_id - b.major_id,
  ), [overview?.majors]);
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = terms.length ? majors.filter((major) => {
    const name = normalize(major.major_name);
    return terms.every((term) => name.includes(term));
  }) : [];
  const hasQuery = terms.length > 0;
  const cards = hasQuery ? matches : showAll ? majors : majors.slice(0, 3);
  const linkFor = (majorId: number) => careerDetailHref(majorId, Number(processId), modality, returnTo);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && matches.length) {
      event.preventDefault();
      resultLinkRefs.current[event.key === "ArrowDown" ? 0 : matches.length - 1]?.focus();
    }
  };
  const handleResultKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  return (
    <section className={styles.discovery} aria-labelledby="career-discovery-title">
      <div className={styles.heading}>
        <div><p className={styles.eyebrow}>Explora tus opciones</p><h1 id="career-discovery-title">Encuentra tu carrera</h1></div>
      </div>

      <div className={styles.searchWrap}>
        <label className={styles.searchLabel} htmlFor="career-search">Busca tu carrera</label>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
          <input ref={searchInputRef} id="career-search" type="search" autoComplete="off" value={query} placeholder="Medicina, Derecho, Ingeniería…" disabled={status !== "ready"}
            onChange={(event) => onQueryChange(event.target.value)} onKeyDown={handleSearchKeyDown} />
          {query && <button className={styles.clear} type="button" aria-label="Limpiar búsqueda" onClick={() => onQueryChange("")}>×</button>}
        </div>
        {status === "loading" && <p className={styles.searchStatus} role="status">Cargando carreras…</p>}
        {status === "error" && <div className={styles.searchStatus} role="alert"><span>No pudimos cargar las carreras.</span>{onRetry && <button type="button" onClick={onRetry}>Reintentar</button>}</div>}
      </div>

      {status === "ready" && <div className={styles.explore}>
        <h2>{hasQuery ? `Resultados para “${query.trim()}”` : showAll ? "Todas las carreras" : "Carreras con más postulantes"}</h2>
        {hasQuery && <p className={styles.resultCount} role="status" aria-live="polite">{matches.length ? `${matches.length} ${matches.length === 1 ? "carrera encontrada" : "carreras encontradas"}.` : "No encontramos carreras con ese nombre."}</p>}
        {cards.length ? <ul className={styles.careerList} aria-label={hasQuery ? "Carreras coincidentes" : undefined}>{cards.map((major, index) => <li key={major.major_id}>
          <Link ref={hasQuery ? (node) => { resultLinkRefs.current[index] = node; } : undefined} className={styles.careerCard} to={linkFor(major.major_id)} state={{ fromDiscovery: true }} onKeyDown={hasQuery ? handleResultKeyDown : undefined}>
            <span className={styles.careerName}>{major.major_name}</span>
            <svg className={styles.cardArrow} viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5 4h7v7" /></svg>
            <span className={styles.metrics}>
              <span className={styles.rateMetric}><strong className={styles.rate}>{rate(major.admitted_count, major.total_results)}</strong><span>Tasa de ingreso</span></span>
              <span className={styles.counts}><span>{formatNumber(major.total_results)} postulantes</span><span>{formatNumber(major.admitted_count)} ingresantes</span></span>
            </span>
          </Link>
        </li>)}</ul> : hasQuery ? null : <div className={styles.emptyState}><p>No hay carreras para los filtros seleccionados.</p></div>}
        {!hasQuery && majors.length > 3 && <button className={styles.showAll} type="button" onClick={() => onShowAllChange(!showAll)}>{showAll ? "Mostrar menos carreras" : "Ver todas las carreras"}</button>}
      </div>}
    </section>
  );
}
