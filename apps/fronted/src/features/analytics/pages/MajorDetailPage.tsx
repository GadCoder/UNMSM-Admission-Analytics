import { Link, useParams, useSearchParams } from "react-router-dom";

import * as api from "../api/analytics";
import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "./DashboardPage.module.css";

function Metric({ label, value }: { label: string; value: string }) {
  return <article className={styles.kpi}><span>{label}</span><strong>{value}</strong></article>;
}

function ProcessMetrics({ item }: { item: MajorDetailProcess }) {
  const rate = item.total_results ? (item.admitted_count / item.total_results) * 100 : 0;
  return <div className={styles.detailProcessMetrics}>
    <strong>{formatProcessLabel(item.process)}</strong>
    <span>{formatNumber(item.total_results)} postulantes</span>
    <span>{formatNumber(item.admitted_count)} ingresantes</span>
    <span>{formatNumber(rate, 1)}% de ingreso</span>
    <span>{formatNumber(item.average_score, 2)} promedio</span>
  </div>;
}

export function MajorDetailPage() {
  const { majorId = "" } = useParams();
  const [params] = useSearchParams();
  const primary = params.get("process") ?? "";
  const comparisons = (params.get("compare")?.split(",").filter((id) => id && id !== primary) ?? []).slice(0, 3);
  const query = api.useMajorDetail(majorId, primary, comparisons);
  const detail = query.data;
  const selected = detail?.selected_processes ?? [];
  const current = selected[0];

  if (query.isPending) return <section className={styles.page}><p role="status" className={styles.state}>Cargando detalle de la carrera…</p></section>;
  if (query.isError || !detail || !current) return <section className={styles.page}><p role="alert" className={styles.state}>No pudimos cargar el detalle de esta carrera.</p><Link className={styles.detailBack} to="/">Volver al dashboard</Link></section>;

  const rate = current.total_results ? (current.admitted_count / current.total_results) * 100 : 0;
  return <section className={styles.page}>
    <Link className={styles.detailBack} to={`/?process=${current.process.id}`}>← Volver al desempeño por carrera</Link>
    <header className={styles.detailHero}>
      <div>
        <p className={styles.eyebrow}>Detalle de carrera · {detail.major.code}</p>
        <h1>{detail.major.name}</h1>
        <p className={styles.intro}>{detail.major.faculty} · {detail.major.academic_area}</p>
      </div>
      <span className={styles.detailProcessBadge}>{formatProcessLabel(current.process)}</span>
    </header>

    <div className={styles.kpis}>
      <Metric label="Postulantes" value={formatNumber(current.total_results)} />
      <Metric label="Postulantes ausentes" value={formatNumber(current.absent_count)} />
      <Metric label="Ingresantes" value={formatNumber(current.admitted_count)} />
      <Metric label="Porcentaje de ingresantes" value={`${formatNumber(rate, 1)}%`} />
      <Metric label="Puntaje máximo" value={formatNumber(current.highest_score, 2)} />
      <Metric label="Puntaje promedio" value={formatNumber(current.average_score, 2)} />
    </div>

    {selected.length > 1 && <section className={styles.card} aria-labelledby="comparison-heading"><h2 id="comparison-heading">Comparación de procesos</h2><div className={styles.detailProcessList}>{selected.map((item) => <ProcessMetrics key={item.process.id} item={item} />)}</div></section>}
    <section className={styles.card} aria-labelledby="history-heading"><h2 id="history-heading">Evolución de la carrera</h2><p className={styles.chartDescription}>Indicadores de la carrera en los procesos de admisión publicados.</p><div className={styles.detailHistory}>{[...selected, ...(detail.history ?? [])].map((item) => <ProcessMetrics key={item.process.id} item={item} />)}</div></section>
  </section>;
}
