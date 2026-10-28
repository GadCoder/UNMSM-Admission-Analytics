import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { useCareerView } from "../../../shared/telemetry/hooks";

import type { MajorDetailProcess, ProcessOverview } from "../api/analytics.types";
import * as api from "../api/analytics";
import { MajorDetailHistory } from "../components/MajorDetailHistory";
import { MetricHistoryChart } from "../components/MetricHistoryChart";
import { MajorDetailLoadingSkeleton } from "../components/LoadingSkeletons";
import { KpiGrid } from "../components/KpiGrid";
import { NewMajorBadge } from "../components/NewMajorBadge";
import { PageBanner } from "../components/PageBanner";
import surfaceStyles from "../components/AnalyticsSurface.module.css";
import styles from "./DashboardPage.module.css";

const ROMAN_SEQUENCE_ORDER: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

function sequenceOrder(sequence: string) {
  const normalized = sequence.trim().toUpperCase();
  const separator = normalized.lastIndexOf("-");
  const value = separator >= 0 ? normalized.slice(separator + 1) : normalized;
  const numeric = Number(value);
  return ROMAN_SEQUENCE_ORDER[value] ?? (Number.isFinite(numeric) ? numeric : 0);
}

function compareProcessPeriod(left: MajorDetailProcess, right: MajorDetailProcess) {
  return (
    left.process.year - right.process.year ||
    sequenceOrder(left.process.sequence) - sequenceOrder(right.process.sequence) ||
    left.process.id - right.process.id
  );
}

function asProcessOverview(item: MajorDetailProcess): ProcessOverview {
  return { ...item, majors: [] };
}

type MajorDetailContentProps = {
  majorId: string;
  processId: string;
  modality: string;
  onSelectProcess: (id: number) => void;
  focusHeading?: boolean;
  headerControls?: ReactNode;
  headerNavigation?: ReactNode;
};

export function MajorDetailContent({
  majorId,
  processId,
  modality,
  onSelectProcess,
  focusHeading = false,
  headerControls,
  headerNavigation,
}: MajorDetailContentProps) {
  const query = api.useMajorDetail(majorId, processId, [], modality);
  const detail = query.data;
  const selected = detail?.selected_processes ?? [];
  const current = [...selected, ...(detail?.history ?? [])].find(
    (item) => String(item.process.id) === processId,
  );

  useCareerView(majorId, processId, modality, Boolean(current) && !query.isPlaceholderData);

  if (!processId)
    return (
      <section className={styles.page}>
        {detail && (
          <CareerIdentity
            name={detail.major.name}
            faculty={detail.major.faculty}
            area={detail.major.academic_area}
            isNew={detail.major.is_new}
            focusHeading={focusHeading}
            controls={headerControls}
            navigation={headerNavigation}
          />
        )}
        <p className={styles.state}>
          Selecciona un proceso y una modalidad para consultar los resultados de esta carrera.
        </p>
      </section>
    );
  if (query.isPending && !detail)
    return (
      <section className={styles.page}>
        <MajorDetailLoadingSkeleton />
      </section>
    );
  if (query.isError && !detail)
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.state}>
          No pudimos cargar el detalle de esta carrera.
        </p>
        <button type="button" className={styles.detailBack} onClick={() => void query.refetch()}>
          Reintentar
        </button>
      </section>
    );
  if (!detail)
    return (
      <section className={styles.page}>
        <MajorDetailLoadingSkeleton />
      </section>
    );

  const byProcessId = new Map<number, MajorDetailProcess>();
  for (const item of [...(detail.history ?? []), ...selected])
    byProcessId.set(item.process.id, item);
  const timeline = [...byProcessId.values()].sort(compareProcessPeriod);
  const historyTimeline = [...timeline].reverse();
  const selectedProcess = current ?? undefined;
  const previous = selectedProcess
    ? timeline.filter((item) => compareProcessPeriod(item, selectedProcess) < 0).at(-1)
    : undefined;

  return (
    <section
      className={styles.page}
      aria-label="Detalle de la carrera"
      aria-busy={query.isFetching}
    >
      {query.isFetching && (
        <div role="status" className={styles.refreshingState}>
          <span className={styles.spinner} aria-hidden="true" />
          Actualizando detalle…
        </div>
      )}
      {query.isError && (
        <p role="alert" className={styles.state}>
          No pudimos actualizar el detalle de esta carrera.{" "}
          <button type="button" onClick={() => void query.refetch()}>
            Reintentar
          </button>
        </p>
      )}
      <CareerIdentity
        name={detail.major.name}
        faculty={detail.major.faculty}
        area={detail.major.academic_area}
        isNew={detail.major.is_new}
        focusHeading={focusHeading}
        controls={headerControls}
        navigation={headerNavigation}
      />
      {selectedProcess ? (
        <KpiGrid
          variant="career"
          overview={asProcessOverview(selectedProcess)}
          previous={previous ? asProcessOverview(previous) : undefined}
        />
      ) : (
        <p role="status" className={styles.state}>
          {query.isPlaceholderData
            ? "Consultando resultados del proceso y la modalidad seleccionados…"
            : "No hay resultados de esta carrera para el proceso y la modalidad seleccionados."}
        </p>
      )}
      <MetricHistoryChart
        items={timeline}
        title="Evolución histórica de la carrera"
        selectedProcessId={selectedProcess?.process.id}
        defaultMetric={
          selectedProcess?.minimum_admitted_score != null &&
          Number.isFinite(selectedProcess.minimum_admitted_score)
            ? "minimum_admitted_score"
            : "total_results"
        }
      />
      <section
        className={`${styles.card} ${styles.comparisonCard}`}
        aria-labelledby="history-heading"
      >
        <header className={styles.comparisonCardHeader}>
          <h2 id="history-heading" className={surfaceStyles.sectionTitle}>
            Resultados históricos
          </h2>
        </header>
        <MajorDetailHistory
          variant="career"
          items={historyTimeline}
          selectedProcessId={selectedProcess?.process.id}
          onSelectProcess={onSelectProcess}
        />
      </section>
    </section>
  );
}

function CareerIdentity({
  name,
  faculty,
  area,
  isNew,
  focusHeading,
  controls,
  navigation,
}: {
  name: string;
  faculty: string;
  area: string;
  isNew: boolean;
  focusHeading: boolean;
  controls?: ReactNode;
  navigation?: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusHeading) headingRef.current?.focus();
  }, [focusHeading, name]);

  return (
    <PageBanner
      eyebrow={faculty}
      title={name}
      titleId="major-detail-title"
      titleRef={headingRef}
      titleAddon={isNew && <NewMajorBadge />}
      description={`Área de ${area}`}
      filters={controls}
      rightContent={navigation}
      detailLayout
    />
  );
}
