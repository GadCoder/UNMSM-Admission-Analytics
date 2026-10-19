import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type { MajorDetailProcess, ProcessOverview } from "../api/analytics.types";
import * as api from "../api/analytics";
import { SelectField } from "../components/SelectField";
import { MajorDetailHistory } from "../components/MajorDetailHistory";
import { canCompareMinimumScores } from "../components/metricHistory";
import { MetricHistoryChart } from "../components/MetricHistoryChart";
import { MajorDetailLoadingSkeleton } from "../components/LoadingSkeletons";
import { KpiGrid } from "../components/KpiGrid";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "./DashboardPage.module.css";

const DEFAULT_MODALITY = "EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)";

const ROMAN_SEQUENCE_ORDER: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

function sequenceOrder(sequence: string) {
  const normalized = sequence.trim().toUpperCase();
  const separator = normalized.lastIndexOf("-");
  const value = separator >= 0 ? normalized.slice(separator + 1) : normalized;
  const numeric = Number(value);
  return ROMAN_SEQUENCE_ORDER[value] ?? (Number.isFinite(numeric) ? numeric : 0);
}

function compareProcessPeriod(left: MajorDetailProcess, right: MajorDetailProcess) {
  return left.process.year - right.process.year
    || sequenceOrder(left.process.sequence) - sequenceOrder(right.process.sequence)
    || left.process.id - right.process.id;
}

function asProcessOverview(item: MajorDetailProcess): ProcessOverview {
  return { ...item, majors: [] };
}

export function MajorDetailPage() {
  const { majorId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const modalitiesQuery = api.useModalities();
  const modality = params.get("modality")?.trim() || DEFAULT_MODALITY;
  const processesQuery = api.usePublishedProcesses();
  const processes = processesQuery.data ?? [];
  const latest = processes[0];
  const primary = params.get("process") ?? (latest ? String(latest.id) : "");

  const query = api.useMajorDetail(majorId, primary, [], modality);
  const detail = query.data;
  const selected = detail?.selected_processes ?? [];
  const current = [...selected, ...(detail?.history ?? [])].find((item) => String(item.process.id) === primary);

  const updateSelection = (nextPrimary: string) => {
    const next = new URLSearchParams(params);
    next.set("process", nextPrimary);
    next.delete("compare");
    setParams(next);
  };

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.delete("compare");
    if (latest && !params.get("process")) next.set("process", String(latest.id));
    next.set("modality", modality);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [latest, modality, params, setParams]);

  if (query.isPending) return <section className={styles.page}><MajorDetailLoadingSkeleton /></section>;
  if (query.isError || !detail || !current) return <section className={styles.page}><p role="alert" className={styles.state}>No pudimos cargar el detalle de esta carrera.</p><Link className={styles.detailBack} to="/">Volver a la vista de proceso</Link></section>;

  const byProcessId = new Map<number, MajorDetailProcess>();
  for (const item of [...(detail.history ?? []), ...selected]) byProcessId.set(item.process.id, item);
  const timeline = [...byProcessId.values()].sort(compareProcessPeriod);
  const historyTimeline = [...timeline].reverse();
  const previous = timeline.filter((item) => compareProcessPeriod(item, current) < 0).at(-1);
  const currentOverview = asProcessOverview(current);


  return <section className={styles.page} aria-label="Detalle de la carrera" aria-busy={query.isFetching}>
    {query.isFetching && <div role="status" className={styles.refreshingState}><span className={styles.spinner} aria-hidden="true" />Actualizando detalle…</div>}
    <Link className={styles.detailBack} to={`/?process=${current.process.id}`}>← Volver a la vista de proceso</Link>
    <header className={styles.hero}>
      <div>
        <h1>{detail.major.name}</h1>
        <p className={styles.intro}>{detail.major.faculty} · {detail.major.academic_area}</p>
      </div>
      <section className={`${styles.processContext} ${styles.detailProcessContext}`} aria-label="Contexto del análisis">
        <div className={styles.primaryProcessControl}>
          <label htmlFor="primary-process">Proceso analizado</label>
          <select id="primary-process" value={primary} onChange={(event) => updateSelection(event.target.value)}>
            {processes.map((process) => <option key={process.id} value={process.id}>{formatProcessLabel(process)}</option>)}
          </select>
        </div>
        {(modalitiesQuery.data?.length ?? 0) > 0 && <div className={styles.detailModalityControl}><SelectField label="Modalidad" aria-label="Modalidad" aria-description={modality} title={modality} value={modality} onChange={(event) => {
          const next = new URLSearchParams(params);
          next.set("modality", event.target.value);
          setParams(next);
        }}>
          {modalitiesQuery.data?.map((item) => <option key={item.id} value={item.name} title={item.name}>{item.name}</option>)}
        </SelectField></div>}
      </section>
    </header>

    <KpiGrid variant="career" overview={currentOverview} previous={previous ? asProcessOverview(previous) : undefined} />
    <MetricHistoryChart items={timeline} title="Evolución histórica de la carrera"
      selectedProcessId={current.process.id}
      defaultMetric={timeline.some((item) => item.process.id !== current.process.id && canCompareMinimumScores(current, item)) ? "minimum_admitted_score" : "total_results"}
    />

    <section className={`${styles.card} ${styles.comparisonCard}`} aria-labelledby="history-heading">
      <header className={styles.comparisonCardHeader}>
        <h2 id="history-heading" className={styles.comparisonSectionTitle}>Resultados históricos</h2>
      </header>
      <MajorDetailHistory
        variant="career"
        items={historyTimeline}
        selectedProcessId={current.process.id}
        onSelectProcess={(processId) => updateSelection(String(processId))}
      />
    </section>
  </section>;
}
