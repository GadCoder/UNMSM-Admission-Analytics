import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import type { MouseEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { trackUsage } from "../../../shared/telemetry/usage";
import { useSearchUsage } from "../../../shared/telemetry/hooks";

import * as api from "../api/analytics";
import type {
  AdmissionProcess,
  MajorCatalogItem,
  MajorDetail,
  MajorDetailProcess,
} from "../api/analytics.types";
import { ResponsiveFilterControls } from "../components/ResponsiveFilterControls";
import { RemovableChip } from "../components/RemovableChip";
import { SelectField } from "../components/SelectField";
import { PageBanner } from "../components/PageBanner";
import { CareerComparisonHistory } from "../components/CareerComparisonHistory";
import { CareerComparisonScores } from "../components/CareerComparisonScores";
import { CareerSearch } from "../components/CareerSearch";
import {
  buildComparisonInsights,
  compareAdmissionProcesses,
  formatCareerComparisonMetric,
  getCareerComparisonMetricValue,
  getComparableCareerMetricValues,
  mergeCareerHistory,
  rankCareerMetric,
  useCareerSeriesSlots,
  type CareerComparisonMetricKey,
  type ComparisonInsightType,
} from "../utils/careerComparison";
import { MAX_COMPARISON_CAREERS, parseCareerComparisonUrl } from "../utils/careerComparisonUrl";
import {
  formatAdmissionModalityLabel,
  modalityNameFromParam,
  modalityUrlValue,
  modalitiesForProcess,
  resolveAdmissionModality,
} from "../utils/admissionModality";
import { formatProcessLabel } from "../utils/processLabels";
import { careerDetailHref } from "../utils/careerNavigation";
import styles from "./CareerComparisonPage.module.css";

type CareerResult = {
  id: number;
  item?: MajorCatalogItem;
  query?: UseQueryResult<MajorDetail, Error>;
  detail?: MajorDetail;
  current?: MajorDetailProcess;
};
const EMPTY_PROCESSES: AdmissionProcess[] = [];

export function CareerComparisonPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const processQuery = api.usePublishedProcesses();
  const modalityQuery = api.useModalities();
  const catalogQuery = api.useMajorCatalog();
  const areaQuery = api.useAcademicAreas();
  const facultyQuery = api.useFaculties();
  const url = useMemo(() => parseCareerComparisonUrl(location.search), [location.search]);
  const processes = processQuery.data ?? EMPTY_PROCESSES;
  const catalog = catalogQuery.data ?? [];
  const processParam = params.get("process");
  const processId = processParam ?? (processes[0] ? String(processes[0].id) : "");
  const selectedProcess = processes.find((item) => String(item.id) === processId);
  const modalities = modalitiesForProcess(modalityQuery.data, selectedProcess);
  const modalityParam = params.get("modality");
  const defaultModalityId = modalityUrlValue(resolveAdmissionModality(undefined), modalities);
  const resolvedModalityId = modalityParam !== null ? modalityParam : (defaultModalityId ?? "");
  const modality = resolvedModalityId
    ? modalityNameFromParam(resolvedModalityId, modalityQuery.data)
    : undefined;
  const metric = url.metric as CareerComparisonMetricKey;
  const catalogReady = Boolean(catalogQuery.data);
  const careerIdsValid =
    catalogReady && url.careerIds.every((id) => catalog.some((item) => item.id === id));
  const mayRequestDetails =
    !url.tooManyCareers && url.malformedCareerIds.length === 0 && (!catalogReady || careerIdsValid);
  const detailQueries = useQueries({
    queries:
      !mayRequestDetails || !selectedProcess || !modality
        ? []
        : url.careerIds.map((id) => ({
            ...api.majorHistoryQueryOptions(id, modality, processes),
            queryFn: ({ signal }) => api.getMajorDetail(id, processId, [], modality, signal),
            enabled: Boolean(selectedProcess),
          })),
  });
  api.useRefreshHistoryOnProcessChange(processId, detailQueries);
  const [search, setSearch] = useState("");
  const [areaId, setAreaId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogSearchRef = useRef<HTMLInputElement>(null);
  const dialogOpenerRef = useRef<HTMLElement | null>(null);

  const updateParams = (next: URLSearchParams, replace = false) =>
    setParams(next, { replace, preventScrollReset: true });
  const setContext = (key: "process" | "modality", value: string) => {
    trackUsage("filter_changed", { page: "comparison", filter: key, value });
    const next = new URLSearchParams(params);
    next.set(key, value);
    updateParams(next);
  };
  const writeCareerIds = (ids: number[]) => {
    trackUsage("comparison_updated", {
      major_ids: ids.join(","),
      process_id: processId,
      modality: resolvedModalityId,
    });
    const next = new URLSearchParams(params);
    if (ids.length) next.set("majors", ids.join(","));
    else next.delete("majors");
    updateParams(next);
  };
  const chooseMetric = (nextMetric: CareerComparisonMetricKey) => {
    const next = new URLSearchParams(params);
    if (nextMetric === "admission_rate") next.delete("metric");
    else next.set("metric", nextMetric);
    updateParams(next);
  };
  const renderComparisonFilters = (suffix: string) => (
    <div className={styles.selectors}>
      <SelectField
        label="Proceso"
        id={`comparison-process-${suffix}`}
        aria-label="Proceso analizado"
        value={processId}
        onChange={(event) => setContext("process", event.target.value)}
      >
        {processes.map((process) => (
          <option key={process.id} value={String(process.id)}>
            {formatProcessLabel(process)}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Modalidad"
        id={`comparison-modality-${suffix}`}
        value={resolvedModalityId}
        onChange={(event) => setContext("modality", event.target.value)}
      >
        {modalities.map((item) => (
          <option key={item.id} value={String(item.id)}>
            {formatAdmissionModalityLabel(item.name)}
          </option>
        ))}
      </SelectField>
    </div>
  );

  const seriesSlots = useCareerSeriesSlots(url.careerIds);
  const selected = url.careerIds.map((id, index): CareerResult => ({
    id,
    item: catalog.find((item) => item.id === id),
    query: detailQueries[index],
    detail: detailQueries[index]?.data,
    current: detailQueries[index]?.data && findCurrent(detailQueries[index].data!, processId),
  }));
  const isPending = selected.some(({ query }) => query?.isPending);
  const hasFailure = selected.some(({ query }) => query?.isError);
  const allKnown = selected.every(({ item }) => item !== undefined);
  const records = selected.map(({ id, item, current }) => ({
    id,
    name: item?.name ?? `Carrera ${id}`,
    record: current ?? null,
  }));
  const scopeByMetric = (key: CareerComparisonMetricKey) =>
    getComparableCareerMetricValues(records, key);
  const admissionRanking = rankCareerMetric(
    scopeByMetric("admission_rate"),
    "admission_rate",
    selected.length,
  );
  const mergedSeries = selected.flatMap(({ id, item, detail }) =>
    detail
      ? [
          {
            id,
            label: item?.name ?? detail.major.name,
            items: mergeCareerHistory(detail.selected_processes, detail.history, Number(processId)),
          },
        ]
      : [],
  );
  const historyProcesses = useMemo(
    () =>
      processes
        .filter(
          (process) => !selectedProcess || compareAdmissionProcesses(process, selectedProcess) <= 0,
        )
        .sort(compareAdmissionProcesses),
    [processes, selectedProcess],
  );

  const filteredCareers = catalog.filter((item) => {
    if (url.careerIds.includes(item.id)) return false;
    if (
      areaId &&
      String(item.faculty_id) &&
      String(
        facultyQuery.data?.find((faculty) => faculty.id === item.faculty_id)?.academic_area_id,
      ) !== areaId
    )
      return false;
    if (facultyId && String(item.faculty_id) !== facultyId) return false;
    const needle = search.trim().toLocaleLowerCase("es-PE");
    return !needle || `${item.name} ${item.code}`.toLocaleLowerCase("es-PE").includes(needle);
  });
  useSearchUsage(
    search,
    filteredCareers.length,
    catalogReady && !catalogQuery.isFetching,
    "comparison",
  );
  const openDialog = (event: MouseEvent<HTMLButtonElement>) => {
    if (url.careerIds.length >= MAX_COMPARISON_CAREERS) return;
    dialogOpenerRef.current = event.currentTarget;
    requestAnimationFrame(() => {
      dialogRef.current?.showModal();
      dialogSearchRef.current?.focus();
    });
  };
  const closeDialog = () => {
    dialogRef.current?.close();
  };
  const addCareer = (id: number) => {
    if (url.careerIds.length >= MAX_COMPARISON_CAREERS || url.careerIds.includes(id)) return;
    writeCareerIds([...url.careerIds, id]);
    closeDialog();
    setSearch("");
  };
  const returnUrl = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!processId || processQuery.isPending || modalityQuery.isPending || !modalities.length)
      return;
    const next = new URLSearchParams(params);
    if (!processParam) next.set("process", processId);
    if (!modalityParam && resolvedModalityId) next.set("modality", resolvedModalityId);
    if (next.toString() !== params.toString())
      setParams(next, { replace: true, preventScrollReset: true });
  }, [
    processId,
    processParam,
    processQuery.isPending,
    modalityParam,
    modalityQuery.isPending,
    modalities.length,
    resolvedModalityId,
    params,
    setParams,
  ]);

  if (processQuery.isPending && !processQuery.data) return <p role="status">Cargando procesos…</p>;
  if (processQuery.isError && !processQuery.data)
    return (
      <RetryState
        message="No pudimos cargar los procesos publicados."
        onRetry={() => void processQuery.refetch()}
      />
    );
  if (!processes.length)
    return <p className={styles.state}>Aún no hay procesos publicados para comparar carreras.</p>;
  if (processParam && !selectedProcess)
    return (
      <section className={styles.state} role="alert">
        <h2>Proceso no disponible</h2>
        <p>El proceso indicado en el enlace no está publicado.</p>
        <button type="button" onClick={() => setContext("process", String(processes[0].id))}>
          Usar el proceso más reciente
        </button>
      </section>
    );
  if (modalityQuery.isPending && !modalityQuery.data)
    return <p role="status">Cargando modalidades…</p>;
  if (modalityQuery.isError && !modalityQuery.data)
    return (
      <RetryState
        message="No pudimos cargar las modalidades."
        onRetry={() => void modalityQuery.refetch()}
      />
    );
  if ((modalityParam !== null || !defaultModalityId) && !modality)
    return (
      <section className={styles.state} role="alert">
        <h2>Modalidad no disponible</h2>
        <p>
          {modalityParam !== null
            ? "La modalidad indicada no está disponible."
            : "La modalidad predeterminada no aparece en el catálogo."}{" "}
          Elige una modalidad para consultar resultados.
        </p>
        <SelectField
          label="Modalidad disponible"
          value=""
          onChange={(event) => event.target.value && setContext("modality", event.target.value)}
        >
          <option value="">Selecciona…</option>
          {modalities.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {formatAdmissionModalityLabel(item.name)}
            </option>
          ))}
        </SelectField>
      </section>
    );
  if (catalogQuery.isPending && !catalogQuery.data)
    return <p role="status">Cargando catálogo de carreras…</p>;

  return (
    <div className={styles.page}>
      <PageBanner
        eyebrow="Compara tus opciones"
        title="Compara carreras"
        titleId="comparison-page-title"
        description="Compara resultados de admisión entre carreras."
        filters={
          <ResponsiveFilterControls
            className={styles.comparisonFilter}
            label="Filtros de comparación"
            title="Filtrar comparación"
            triggerLabel="Abrir filtros de comparación"
            desktopContent={renderComparisonFilters("desktop")}
          >
            {renderComparisonFilters("panel")}
          </ResponsiveFilterControls>
        }
      >
        <p className={styles.activeContext} aria-label="Filtros activos">
          <span>Proceso: {selectedProcess ? formatProcessLabel(selectedProcess) : "—"}</span>
          <span aria-hidden="true"> · </span>
          <span>
            Modalidad: {modality ? compactModalityLabel(modality) : "Modalidad no disponible"}
          </span>
        </p>
      </PageBanner>
      <section className={styles.selectionPanel} aria-label="Panel de selección de carreras">
        <div className={styles.careerGroup}>
          <div className={styles.selectionHeading}>
            <h2 className={styles.selectionLabel}>Carreras seleccionadas</h2>
            <p
              className={styles.selectionCount}
              aria-label={`${url.careerIds.length} de 4 carreras seleccionadas`}
            >
              {url.careerIds.length} de 4
            </p>
          </div>
          {url.careerIds.length < 2 && (
            <p className={styles.selectionHelp}>Selecciona entre 2 y 4 carreras para comparar.</p>
          )}
          <div className={styles.careerItems}>
            <div className={styles.chipRow} aria-label="Carreras seleccionadas">
              {selected.map(({ id, item }) => (
                <RemovableChip
                  key={id}
                  className={styles.careerChip}
                  label={item?.name ?? `Carrera ${id}`}
                  accessibleName={`Quitar ${item?.name ?? `carrera ${id}`} de la comparación`}
                  onRemove={() =>
                    writeCareerIds(url.careerIds.filter((careerId) => careerId !== id))
                  }
                />
              ))}
            </div>
            <button
              type="button"
              className={`${styles.addButton} ${
                url.careerIds.length === 0 ? styles.addButtonPrimary : ""
              }`}
              onClick={openDialog}
              disabled={url.careerIds.length >= MAX_COMPARISON_CAREERS}
              aria-describedby="selection-limit"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Añadir carrera</span>
            </button>
          </div>
          {url.careerIds.length > 0 && (
            <div className={styles.resetRow}>
              <button
                type="button"
                className={styles.reset}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.delete("majors");
                  next.delete("metric");
                  updateParams(next);
                }}
              >
                Limpiar selección
              </button>
            </div>
          )}
        </div>
        <span id="selection-limit" className={styles.srOnly} aria-live="polite">
          {url.careerIds.length >= MAX_COMPARISON_CAREERS
            ? "Puedes comparar hasta cuatro carreras."
            : `${MAX_COMPARISON_CAREERS - url.careerIds.length} espacios disponibles.`}
        </span>
      </section>

      {(url.malformedCareerIds.length > 0 || url.tooManyCareers || url.invalidMetric) && (
        <section className={styles.validation} role="alert">
          <h2>Revisa los datos del enlace</h2>
          {url.malformedCareerIds.length > 0 && (
            <p>
              Algunas selecciones tienen un formato no válido. Puedes quitarlas y conservar las
              carreras válidas.
            </p>
          )}
          {url.tooManyCareers && (
            <p>
              El enlace incluye más de cuatro carreras; no se consultarán datos hasta reducir la
              selección.
            </p>
          )}
          {url.invalidMetric && <p>La métrica histórica del enlace no es válida.</p>}
          <div>
            {url.malformedCareerIds.length > 0 && (
              <button type="button" onClick={() => writeCareerIds(url.careerIds)}>
                Quitar selecciones no válidas
              </button>
            )}
            {url.tooManyCareers && (
              <button
                type="button"
                onClick={() => writeCareerIds(url.careerIds.slice(0, MAX_COMPARISON_CAREERS))}
              >
                Conservar las primeras cuatro
              </button>
            )}
            {url.invalidMetric && (
              <button type="button" onClick={() => chooseMetric("admission_rate")}>
                Usar tasa de ingreso
              </button>
            )}
          </div>
        </section>
      )}
      {catalogQuery.isError && (
        <RetryState
          message="No pudimos validar el catálogo de carreras."
          onRetry={() => void catalogQuery.refetch()}
        />
      )}
      {!allKnown && catalogQuery.data && (
        <section className={styles.validation} role="alert">
          <h2>Hay carreras que ya no están disponibles</h2>
          <p>Quita las carreras inactivas para continuar. No se infiere la causa.</p>
          {selected
            .filter(({ item }) => !item)
            .map(({ id }) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  writeCareerIds(url.careerIds.filter((candidate) => candidate !== id))
                }
              >
                Quitar carrera {id}
              </button>
            ))}
        </section>
      )}

      {url.careerIds.length > 0 &&
        !url.tooManyCareers &&
        url.malformedCareerIds.length === 0 &&
        allKnown && (
          <ComparisonResults
            selected={selected}
            process={selectedProcess}
            modality={modality ?? ""}
            metric={metric}
            hasFailure={hasFailure}
            isPending={isPending}
            admissionRanking={admissionRanking}
            mergedSeries={mergedSeries}
            historyProcesses={historyProcesses}
            seriesSlots={seriesSlots}
            onMetricChange={chooseMetric}
            returnUrl={returnUrl}
            processId={processId}
            modalityId={resolvedModalityId}
            onRetry={() =>
              detailQueries.forEach((query) => {
                if (query.isError) void query.refetch();
              })
            }
          />
        )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="career-dialog-title"
        onClose={() => requestAnimationFrame(() => dialogOpenerRef.current?.focus())}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
      >
        <div className={styles.dialogHeader}>
          <div>
            <span className={styles.eyebrow}>SELECCIÓN</span>
            <h2 id="career-dialog-title">Añadir carrera</h2>
          </div>
          <button type="button" aria-label="Cerrar búsqueda" onClick={closeDialog}>
            ×
          </button>
        </div>
        <div className={styles.dialogSearch}>
          <CareerSearch
            query={search}
            status="ready"
            inputRef={dialogSearchRef}
            onQueryChange={setSearch}
            label="Buscar por nombre"
          />
        </div>
        <div className={styles.dialogFilters}>
          <SelectField
            label="Área académica"
            value={areaId}
            onChange={(event) => {
              setAreaId(event.target.value);
              setFacultyId("");
            }}
          >
            <option value="">Todas las áreas</option>
            {(areaQuery.data ?? []).map((area) => (
              <option key={area.id} value={String(area.id)}>
                {area.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Facultad"
            value={facultyId}
            onChange={(event) => setFacultyId(event.target.value)}
          >
            <option value="">Todas las facultades</option>
            {(facultyQuery.data ?? [])
              .filter((faculty) => !areaId || String(faculty.academic_area_id) === areaId)
              .map((faculty) => (
                <option key={faculty.id} value={String(faculty.id)}>
                  {faculty.name}
                </option>
              ))}
          </SelectField>
        </div>
        <ul className={styles.searchResults}>
          {filteredCareers.slice(0, 40).map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => addCareer(item.id)}>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
          {filteredCareers.length === 0 && (
            <li className={styles.noResults}>No encontramos carreras con esos filtros.</li>
          )}
        </ul>
      </dialog>
    </div>
  );
}

function ComparisonResults(props: {
  selected: CareerResult[];
  process?: { id: number; year: number; sequence: string; name: string };
  modality: string;
  metric: CareerComparisonMetricKey;
  hasFailure: boolean;
  isPending: boolean;
  admissionRanking: ReturnType<typeof rankCareerMetric>;
  mergedSeries: Array<{
    id: number;
    label: string;
    items: MajorDetailProcess[];
  }>;
  historyProcesses: MajorDetailProcess["process"][];
  seriesSlots: ReadonlyMap<number | string, number>;
  onMetricChange: (metric: CareerComparisonMetricKey) => void;
  returnUrl: string;
  processId: string;
  modalityId: string;
  onRetry: () => void;
}) {
  const { selected, process, modality, metric, hasFailure, isPending } = props;
  const enoughCareers = selected.length > 1;
  const conclusionsReady = enoughCareers && !isPending && !hasFailure;
  const insights = conclusionsReady
    ? buildComparisonInsights(
        selected.map(({ item, current, id }) => ({
          name: item?.name ?? `Carrera ${id}`,
          admissionRate: current ? getCareerComparisonMetricValue(current, "admission_rate") : null,
          applicants: current ? getCareerComparisonMetricValue(current, "total_results") : null,
          admitted: current ? getCareerComparisonMetricValue(current, "admitted_count") : null,
        })),
      )
    : [];
  return (
    <>
      {hasFailure && (
        <div className={styles.error} role="alert">
          <p>
            No pudimos cargar algunas carreras. Las comparaciones se mostrarán cuando todas las
            solicitudes finalicen correctamente.
          </p>
          <button type="button" onClick={props.onRetry}>
            Reintentar fallidas
          </button>
        </div>
      )}
      {isPending && (
        <p className={styles.loading} role="status">
          Cargando resultados de las carreras seleccionadas…
        </p>
      )}
      {enoughCareers && (
        <section
          className={`${styles.section} ${styles.comparisonSection}`}
          aria-labelledby="summary-title"
        >
          <header className={styles.sectionHeader}>
            <div>
              <h2 id="summary-title">Comparación de carreras</h2>
              <p>
                {process
                  ? `${formatProcessLabel(process)} · ${compactModalityLabel(modality)}`
                  : "Proceso y modalidad seleccionados"}
              </p>
            </div>
          </header>
          {conclusionsReady && insights.length ? (
            <div className={styles.comparisonSummary}>
              <strong>Lo más destacado</strong>
              {insights.map((insight) => (
                <div className={styles.insightRow} key={`${insight.type}-${insight.text}`}>
                  <ComparisonInsightIcon type={insight.type} />
                  <p>{insight.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>
              {isPending
                ? "Esperando los resultados de todas las carreras…"
                : hasFailure
                  ? "Las conclusiones se habilitarán cuando se completen las solicitudes."
                  : conclusionsReady
                    ? "No hay diferencias destacables en los datos disponibles para resumir."
                    : "Se necesitan al menos dos carreras con datos comparables para generar conclusiones."}
            </p>
          )}
          <h3 className={styles.resultsHeading}>Resultados por carrera</h3>
          <div
            className={styles.cards}
            style={
              {
                "--career-count": Math.max(1, Math.min(4, selected.length)),
              } as React.CSSProperties
            }
          >
            {selected.map(({ id, item, detail, current, query }) => (
              <CareerCard
                key={id}
                id={id}
                item={item}
                detail={detail}
                current={current}
                query={query}
                rateRanking={props.admissionRanking}
                href={careerDetailHref(id, Number(props.processId), {
                  modalityId: props.modalityId,
                  comparisonReturnTo: props.returnUrl,
                })}
              />
            ))}
          </div>
        </section>
      )}

      {enoughCareers && (
        <CareerComparisonHistory
          series={props.mergedSeries}
          processes={props.historyProcesses}
          metric={metric}
          onMetricChange={props.onMetricChange}
          selectedProcessId={process?.id}
          seriesSlots={props.seriesSlots}
          loading={isPending}
          failed={hasFailure}
          expectedCareers={selected.map(({ id, item }) => ({
            id,
            label: item?.name ?? `Carrera ${id}`,
          }))}
          periodLabel={
            props.historyProcesses.length > 0
              ? `${formatProcessLabel(props.historyProcesses[0])}–${formatProcessLabel(
                  props.historyProcesses.at(-1)!,
                )}`
              : undefined
          }
          insightsEnabled={
            !isPending && !hasFailure && props.mergedSeries.length === selected.length
          }
        />
      )}

      {enoughCareers && (
        <section className={styles.section} aria-labelledby="scores-title">
          <header className={styles.sectionHeader}>
            <h2 id="scores-title">Puntajes de referencia</h2>
          </header>
          <CareerComparisonScores
            selected={selected.map(({ id, item, current }) => ({
              id,
              label: item?.name ?? `Carrera ${id}`,
              current,
            }))}
            seriesSlots={props.seriesSlots}
          />
        </section>
      )}
    </>
  );
}

function CareerCard({
  id,
  item,
  detail,
  current,
  query,
  rateRanking,
  href,
}: {
  id: number;
  item?: MajorCatalogItem;
  detail?: MajorDetail;
  current?: MajorDetailProcess;
  query?: UseQueryResult<MajorDetail, Error>;
  rateRanking: ReturnType<typeof rankCareerMetric>;
  href: string;
}) {
  const [ratioHintOpen, setRatioHintOpen] = useState(false);
  const name = item?.name ?? detail?.major.name ?? `Carrera ${id}`;
  if (query?.isPending && !detail)
    return (
      <article className={styles.careerCard} aria-busy="true">
        <h3>{name}</h3>
        <p role="status">Cargando resultados…</p>
        <Link className={styles.cardDetailLink} to={href} aria-label={`Ver detalle de ${name}`}>
          Ver detalle →
        </Link>
      </article>
    );
  if (query?.isError && !detail)
    return (
      <article className={styles.careerCard}>
        <h3>{name}</h3>
        <p role="alert">No pudimos cargar sus resultados.</p>
        <Link className={styles.cardDetailLink} to={href} aria-label={`Ver detalle de ${name}`}>
          Ver detalle →
        </Link>
      </article>
    );
  if (!current || current.total_results === 0)
    return (
      <article className={styles.careerCard}>
        <h3>{name}</h3>
        <p className={styles.muted}>Sin datos para este proceso y modalidad.</p>
        <Link className={styles.cardDetailLink} to={href} aria-label={`Ver detalle de ${name}`}>
          Ver detalle →
        </Link>
      </article>
    );
  const values: Array<[string, CareerComparisonMetricKey]> = [
    ["Postulantes registrados", "total_results"],
    ["Ingresantes", "admitted_count"],
    ["Postulantes por ingresante", "applicants_per_admitted"],
  ];
  return (
    <article className={styles.careerCard}>
      <h3>{name}</h3>
      <div className={styles.primaryMetric}>
        <span>Tasa de ingreso</span>
        <strong>
          {formatCareerComparisonMetric(
            getCareerComparisonMetricValue(current, "admission_rate"),
            "admission_rate",
            rateRanking.precision,
          )}
        </strong>
      </div>
      {values.map(([label, key]) => {
        const value = getCareerComparisonMetricValue(current, key);
        return (
          <dl key={key}>
            <dt>
              {label}
              {key === "applicants_per_admitted" && (
                <span className={styles.metricHintWrap}>
                  <button
                    type="button"
                    className={styles.metricHintButton}
                    aria-label="Qué significa postulantes por ingresante"
                    aria-describedby={`ratio-hint-${id}`}
                    aria-expanded={ratioHintOpen}
                    onClick={() => setRatioHintOpen((open) => !open)}
                    onFocus={() => setRatioHintOpen(true)}
                    onBlur={() => setRatioHintOpen(false)}
                  >
                    i
                  </button>
                  {ratioHintOpen && (
                    <span className={styles.metricTooltip} id={`ratio-hint-${id}`} role="tooltip">
                      Cantidad de postulantes por cada persona que ingresó en este proceso y
                      modalidad.
                    </span>
                  )}
                </span>
              )}
            </dt>
            <dd>{value === null ? "—" : formatCareerComparisonMetric(value, key)}</dd>
          </dl>
        );
      })}
      <Link className={styles.cardDetailLink} to={href} aria-label={`Ver detalle de ${name}`}>
        Ver detalle →
      </Link>
    </article>
  );
}

function ComparisonInsightIcon({ type }: { type: ComparisonInsightType }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false,
  };
  switch (type) {
    case "admission_rate":
      return (
        <svg {...common}>
          <path d="M16 3h5v5" />
          <path d="m21 3-7 7-4-4-7 7" />
          <path d="M3 17v4h18" />
          <path d="m8 17 4-4 3 3" />
        </svg>
      );
    case "demand":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "admitted":
      return (
        <svg {...common}>
          <path d="m22 10-10 5L2 10l10-5 10 5Z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5M22 10v6" />
        </svg>
      );
    case "applicants_per_admitted":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1M16 11a3 3 0 1 0 0-6M18 14a5 5 0 0 1 3 5v1" />
        </svg>
      );
    case "score":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
          <path d="m16 8 5-5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
        </svg>
      );
  }
}

function compactModalityLabel(modality: string) {
  const normalized = modality.toLocaleLowerCase("es-PE");
  return normalized.includes("ebr") && normalized.includes("eba")
    ? "EBR y EBA"
    : formatAdmissionModalityLabel(modality);
}

function findCurrent(detail: MajorDetail, processId: string) {
  return [...(detail.selected_processes ?? []), ...(detail.history ?? [])].find(
    (item) => String(item.process.id) === processId,
  );
}

function RetryState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.state} role="alert">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}
