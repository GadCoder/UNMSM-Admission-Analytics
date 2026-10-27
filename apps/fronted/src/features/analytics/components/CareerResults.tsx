import type { KeyboardEvent, RefObject } from "react";
import { Link } from "react-router-dom";

import type { MajorOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { careerDetailHref, type CareerNavigationContext } from "../utils/careerNavigation";
import { NewMajorBadge } from "./NewMajorBadge";
import styles from "./CareerDiscovery.module.css";

type CareerResultsProps = {
  majors: MajorOverview[];
  hasQuery: boolean;
  query: string;
  processId: string;
  navigation: CareerNavigationContext;
  showAll: boolean;
  resultLinkRefs: RefObject<Array<HTMLAnchorElement | null>>;
  onShowAllChange: (showAll: boolean) => void;
  onResultKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
};

const rate = (admitted: number, applicants: number) => applicants > 0 ? `${formatNumber(admitted / applicants * 100, 1)}%` : "No disponible";

export function CareerResults({ majors, hasQuery, query, processId, navigation, showAll, resultLinkRefs, onShowAllChange, onResultKeyDown }: CareerResultsProps) {
  const cards = hasQuery ? majors : showAll ? majors : majors.slice(0, 3);
  return <div className={styles.explore}>
    <h2>{hasQuery ? `Resultados para “${query.trim()}”` : showAll ? "Todas las carreras" : "Carreras con más postulantes"}</h2>
    {hasQuery && <p className={styles.resultCount} role="status" aria-live="polite">{majors.length ? `${majors.length} ${majors.length === 1 ? "carrera encontrada" : "carreras encontradas"}.` : "No encontramos carreras con ese nombre."}</p>}
    {cards.length ? <ul className={styles.careerList} aria-label={hasQuery ? "Carreras coincidentes" : undefined}>{cards.map((major, index) => <li key={major.major_id}>
      <Link ref={hasQuery ? (node) => { resultLinkRefs.current[index] = node; } : undefined} className={styles.careerCard} to={careerDetailHref(major.major_id, Number(processId), navigation)} state={{ fromDiscovery: true }} onKeyDown={hasQuery ? onResultKeyDown : undefined}>
        <span className={styles.careerIdentity}><span className={styles.careerName}>{major.major_name}</span>{major.is_new && <NewMajorBadge />}</span>
        <svg className={styles.cardArrow} viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5 4h7v7" /></svg>
        <span className={styles.metrics}>
          <span className={styles.rateMetric}><strong className={styles.rate}>{rate(major.admitted_count, major.total_results)}</strong><span>Tasa de ingreso</span></span>
          <span className={styles.counts}><span>{formatNumber(major.total_results)} postulantes</span><span>{formatNumber(major.admitted_count)} ingresantes</span></span>
        </span>
      </Link>
    </li>)}</ul> : hasQuery ? null : <div className={styles.emptyState}><p>No hay carreras para los filtros seleccionados.</p></div>}
    {!hasQuery && majors.length > 3 && <button className={styles.showAll} type="button" onClick={() => onShowAllChange(!showAll)}>{showAll ? "Mostrar menos carreras" : "Ver todas las carreras"}</button>}
  </div>;
}
