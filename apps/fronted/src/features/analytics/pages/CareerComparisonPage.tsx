import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import type { MouseEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import * as api from "../api/analytics";
import type {
  AdmissionProcess,
  MajorCatalogItem,
  MajorDetail,
  MajorDetailProcess,
} from "../api/analytics.types";
import { DashboardControls } from "../components/DashboardControls";
import { SelectField } from "../components/SelectField";
import { CareerComparisonHistory } from "../components/CareerComparisonHistory";
import { PageBanner } from "../components/PageBanner";
import { CareerSearch } from "../components/CareerSearch";
import {
  canCompareAdmittedScores,
  compareAdmissionProcesses,
  formatCareerComparisonMetric,
  getCareerComparisonMetricValue,
  getComparableCareerMetricValues,
  mergeCareerHistory,
  rankCareerMetric,
  useCareerSeriesSlots,
  type CareerComparisonMetricKey,
} from "../utils/careerComparison";
import { MAX_COMPARISON_CAREERS, parseCareerComparisonUrl } from "../utils/careerComparisonUrl";
import {
  formatAdmissionModalityLabel,
  modalityNameFromParam,
  modalityUrlValue,
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
  const modalities = modalityQuery.data ?? [];
  const catalog = catalogQuery.data ?? [];
  const processParam = params.get("process");
  const processId = processParam ?? (processes[0] ? String(processes[0].id) : "");
  const selectedProcess = processes.find((item) => String(item.id) === processId);
  const modalityParam = params.get("modality");
  const defaultModalityId = modalityUrlValue(resolveAdmissionModality(undefined), modalities);
  const resolvedModalityId = modalityParam !== null ? modalityParam : (defaultModalityId ?? "");
  const modality = resolvedModalityId
    ? modalityNameFromParam(resolvedModalityId, modalities)
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
            queryFn: () => api.getMajorDetail(id, processId, [], modality),
            enabled: Boolean(selectedProcess),
          })),
  });
  api.useRefreshHistoryOnProcessChange(processId, detailQueries);
  const [search, setSearch] = useState("");
  const [areaId, setAreaId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogSearchRef = useRef<HTMLInputElement>(null);
  const dialogOpenerRef = useRef<HTMLElement | null>(null);

  const updateParams = (next: URLSearchParams, replace = false) =>
    setParams(next, { replace, preventScrollReset: true });
  const setContext = (key: "process" | "modality", value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    updateParams(next);
  };
  const writeCareerIds = (ids: number[]) => {
    const next = new URLSearchParams(params);
    if (ids.length) next.set("careers", ids.join(","));
    else next.delete("careers");
    updateParams(next);
  };
  const chooseMetric = (nextMetric: CareerComparisonMetricKey) => {
    const next = new URLSearchParams(params);
    if (nextMetric === "admission_rate") next.delete("metric");
    else next.set("metric", nextMetric);
    updateParams(next);
  };

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
  const demandRanking = rankCareerMetric(
    scopeByMetric("total_results"),
    "total_results",
    selected.length,
  );
  const minScoreRanking = rankCareerMetric(
    scopeByMetric("minimum_admitted_score"),
    "minimum_admitted_score",
    selected.length,
  );
  const maxRateRanking = admissionRanking;
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
        description="Compara tasas de ingreso, demanda y puntajes históricos entre tus opciones."
        filters={
          <section className={styles.controls} aria-label="Controles de comparación">
            <div className={styles.selectors}>
              <DashboardControls
                processes={processes}
                primaryId={processId}
                onChange={(id) => setContext("process", id)}
              />
              <SelectField
                label="Modalidad"
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
            {selectedProcess && historyProcesses.length > 0 && (
              <p className={styles.period}>
                Periodo histórico: {formatProcessLabel(historyProcesses[0])}–
                {formatProcessLabel(historyProcesses.at(-1)!)}
              </p>
            )}
          </section>
        }
      />

      <section className={styles.selectionPanel} aria-label="Panel de selección de carreras">
        <h2>Carreras para comparar</h2>
        <p className={styles.selectionHelp}>
          <span className={styles.desktopHelp}>
            Selecciona entre 2 y 4 carreras para comparar sus resultados.
          </span>
          <span className={styles.mobileHelp}>Selecciona entre 2 y 4 carreras.</span>
        </p>
        <div className={styles.chipRow} aria-label="Carreras seleccionadas">
          {selected.map(({ id, item }) => (
            <span className={styles.chip} key={id}>
              {item?.name ?? `Carrera ${id}`}
              <button
                type="button"
                aria-label={`Quitar ${item?.name ?? `carrera ${id}`} de la comparación`}
                onClick={() => writeCareerIds(url.careerIds.filter((careerId) => careerId !== id))}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className={styles.addButton}
            onClick={openDialog}
            disabled={url.careerIds.length >= MAX_COMPARISON_CAREERS}
            aria-describedby="selection-limit"
          >
            Añadir carrera
          </button>
        </div>
        <span id="selection-limit" className={styles.srOnly} aria-live="polite">
          {url.careerIds.length >= MAX_COMPARISON_CAREERS
            ? "Puedes comparar hasta cuatro carreras."
            : `${MAX_COMPARISON_CAREERS - url.careerIds.length} espacios disponibles.`}
        </span>
        {url.careerIds.length >= MAX_COMPARISON_CAREERS && (
          <p className={styles.limit} role="status">
            Ya seleccionaste cuatro carreras. Quita una para añadir otra.
          </p>
        )}
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.delete("careers");
            next.delete("metric");
            updateParams(next);
          }}
        >
          Reiniciar comparación
        </button>
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

      {url.careerIds.length === 1 && (
        <p className={styles.prompt}>Agrega otra carrera para ver comparaciones y conclusiones.</p>
      )}
      {url.careerIds.length > 0 &&
        !url.tooManyCareers &&
        url.malformedCareerIds.length === 0 &&
        allKnown && (
          <ComparisonResults
            selected={selected}
            records={records}
            process={selectedProcess}
            modality={modality ?? ""}
            metric={metric}
            hasFailure={hasFailure}
            isPending={isPending}
            admissionRanking={admissionRanking}
            demandRanking={demandRanking}
            minScoreRanking={minScoreRanking}
            maxRateRanking={maxRateRanking}
            mergedSeries={mergedSeries}
            historyProcesses={historyProcesses}
            seriesSlots={seriesSlots}
            onMetricChange={chooseMetric}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails((value) => !value)}
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
                <small>{item.code}</small>
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
  records: Array<{
    id: number;
    name: string;
    record: MajorDetailProcess | null;
  }>;
  process?: { id: number; year: number; sequence: string; name: string };
  modality: string;
  metric: CareerComparisonMetricKey;
  hasFailure: boolean;
  isPending: boolean;
  admissionRanking: ReturnType<typeof rankCareerMetric>;
  demandRanking: ReturnType<typeof rankCareerMetric>;
  minScoreRanking: ReturnType<typeof rankCareerMetric>;
  maxRateRanking: ReturnType<typeof rankCareerMetric>;
  mergedSeries: Array<{
    id: number;
    label: string;
    items: MajorDetailProcess[];
  }>;
  historyProcesses: MajorDetailProcess["process"][];
  seriesSlots: ReadonlyMap<number | string, number>;
  onMetricChange: (metric: CareerComparisonMetricKey) => void;
  showDetails: boolean;
  onToggleDetails: () => void;
  returnUrl: string;
  processId: string;
  modalityId: string;
  onRetry: () => void;
}) {
  const { selected, records, process, modality, metric, hasFailure, isPending } = props;
  const enoughCareers = selected.length > 1;
  const conclusionsReady = enoughCareers && !isPending && !hasFailure;
  const leaders = (item: NonNullable<ReturnType<typeof summaryItem>>) => item.names.join(", ");
  const summaryItems = conclusionsReady
    ? [
        summaryItem("Menor tasa de ingreso", props.admissionRanking, "admission_rate"),
        ...(props.admissionRanking.tied
          ? []
          : [summaryItem("Mayor tasa de ingreso", props.maxRateRanking, "admission_rate", true)]),
        summaryItem("Mayor demanda registrada", props.demandRanking, "total_results", true),
        summaryItem(
          "Puntaje mínimo de ingreso más alto",
          props.minScoreRanking,
          "minimum_admitted_score",
          true,
        ),
      ].filter(Boolean)
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
        <section className={styles.section} aria-labelledby="summary-title">
          <header className={styles.sectionHeader}>
            <div>
              <h2 id="summary-title">Resumen rápido</h2>
              <p>
                {process
                  ? `${formatProcessLabel(process)} · ${formatAdmissionModalityLabel(modality)}`
                  : "Proceso y modalidad seleccionados"}
              </p>
            </div>
          </header>
          {conclusionsReady && summaryItems.length ? (
            <ul className={styles.summaryGrid}>
              {summaryItems.map((item) => (
                <li key={item!.title}>
                  <span>{item!.title}</span>
                  <strong>{leaders(item!)}</strong>
                  <small>
                    {formatCareerComparisonMetric(
                      item!.value,
                      item!.metric,
                      item!.ranking.precision,
                    )}
                  </small>
                  {item!.ranking.scope && <em>{item!.ranking.scope}</em>}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>
              {isPending
                ? "Esperando los resultados de todas las carreras…"
                : hasFailure
                  ? "Las conclusiones se habilitarán cuando se completen las solicitudes."
                  : "Se necesitan al menos dos carreras con datos comparables para generar conclusiones."}
            </p>
          )}
          <p className={styles.disclaimer}>
            Estas tasas describen resultados del proceso seleccionado; no representan tu
            probabilidad personal de ingreso.
          </p>
        </section>
      )}

      <section className={styles.section} aria-labelledby="cards-title">
        <header className={styles.sectionHeader}>
          <div>
            <h2 id="cards-title">Resultados del proceso</h2>
            <p>Datos observados para cada carrera seleccionada.</p>
          </div>
        </header>
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
              conclusionsReady={conclusionsReady}
            />
          ))}
        </div>
      </section>

      {enoughCareers && (
        <CareerComparisonHistory
          series={props.mergedSeries}
          processes={props.historyProcesses}
          metric={metric}
          onMetricChange={props.onMetricChange}
          selectedProcessId={process?.id}
          seriesSlots={props.seriesSlots}
          insightsEnabled={
            !isPending && !hasFailure && props.mergedSeries.length === selected.length
          }
        />
      )}

      {enoughCareers && (
        <section className={styles.section} aria-labelledby="scores-title">
          <header className={styles.sectionHeader}>
            <div>
              <h2 id="scores-title">Puntajes de referencia</h2>
              <p>Resultados históricos de ingresantes; no garantizan el ingreso en otro proceso.</p>
            </div>
          </header>
          <p className={styles.muted}>
            El mínimo es el menor puntaje válido registrado entre los ingresantes del proceso y
            modalidad seleccionados. No es un puntaje oficial de corte ni una meta recomendada; se
            excluyen registros sin puntaje válido.
          </p>
          <ScoreReferenceTable selected={selected} />
          <p className={styles.note}>
            Las estadísticas usan la población de ingresantes con puntajes válidos. Los valores
            ausentes se muestran como —.
          </p>
        </section>
      )}

      <section className={styles.section} aria-labelledby="detail-title">
        <button
          type="button"
          className={styles.disclosure}
          aria-expanded={props.showDetails}
          aria-controls="comparison-detail"
          onClick={props.onToggleDetails}
        >
          <span>
            <strong id="detail-title">Comparación detallada</strong>
            <small>Postulantes, ingresantes, ausentes y puntajes</small>
          </span>
          <span aria-hidden="true">{props.showDetails ? "−" : "+"}</span>
        </button>
        {props.showDetails && (
          <div
            id="comparison-detail"
            className={styles.tableWrap}
            role="region"
            aria-label="Comparación detallada"
            tabIndex={0}
          >
            <p className={styles.note}>
              Postulantes por ingresante se muestra como — cuando no hubo ingresantes; los puntajes
              no disponibles también se muestran como —.
            </p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Indicador</th>
                  {records.map((row) => (
                    <th key={row.id} scope="col">
                      {row.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Postulantes registrados", "total_results"],
                  ["Ingresantes", "admitted_count"],
                  ["Tasa de ingreso", "admission_rate"],
                  ["Ausentes", "absent_count"],
                  ["Postulantes por ingresante", "applicants_per_admitted"],
                  ["Puntaje mínimo de ingreso", "minimum_admitted_score"],
                  ["Puntaje promedio de ingresantes", "average_score"],
                  ["Puntaje máximo de ingresantes", "highest_score"],
                ].map(([label, key]) => (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    {records.map(({ id, record }) => {
                      const value = record
                        ? getCareerComparisonMetricValue(record, key as CareerComparisonMetricKey)
                        : null;
                      return (
                        <td key={id}>
                          {!record || record.total_results === 0
                            ? "Sin datos para este proceso y modalidad"
                            : value === null
                              ? "—"
                              : formatCareerComparisonMetric(
                                  value,
                                  key as CareerComparisonMetricKey,
                                )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <nav className={styles.nextActions} aria-label="Siguientes acciones">
        <h2>Explora en detalle</h2>
        {records.map(({ id, name }) => (
          <Link
            key={id}
            to={careerDetailHref(id, Number(props.processId), {
              modalityId: props.modalityId,
              comparisonReturnTo: props.returnUrl,
            })}
          >
            Ver detalle de {name}
          </Link>
        ))}
      </nav>
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
  conclusionsReady,
}: {
  id: number;
  item?: MajorCatalogItem;
  detail?: MajorDetail;
  current?: MajorDetailProcess;
  query?: UseQueryResult<MajorDetail, Error>;
  rateRanking: ReturnType<typeof rankCareerMetric>;
  conclusionsReady: boolean;
}) {
  const name = item?.name ?? detail?.major.name ?? `Carrera ${id}`;
  if (query?.isPending && !detail)
    return (
      <article className={styles.careerCard} aria-busy="true">
        <h3>{name}</h3>
        <p role="status">Cargando resultados…</p>
      </article>
    );
  if (query?.isError && !detail)
    return (
      <article className={styles.careerCard}>
        <h3>{name}</h3>
        <p role="alert">No pudimos cargar sus resultados.</p>
      </article>
    );
  if (!current || current.total_results === 0)
    return (
      <article className={styles.careerCard}>
        <h3>{name}</h3>
        <p className={styles.muted}>Sin datos para este proceso y modalidad.</p>
      </article>
    );
  const values: Array<[string, CareerComparisonMetricKey]> = [
    ["Postulantes registrados", "total_results"],
    ["Ingresantes", "admitted_count"],
    ["Postulantes por ingresante", "applicants_per_admitted"],
    ["Puntaje mínimo de ingreso", "minimum_admitted_score"],
  ];
  const isLowest =
    conclusionsReady &&
    rateRanking.minimum.some((row) => row.id === id) &&
    rateRanking.eligible.length > 1;
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
            <dt>{label}</dt>
            <dd>{value === null ? "—" : formatCareerComparisonMetric(value, key)}</dd>
          </dl>
        );
      })}
      {isLowest && (
        <p className={styles.cardInterpretation}>
          {rateRanking.minimum.length > 1
            ? "Comparte la menor tasa de ingreso"
            : "Registró la menor tasa de ingreso"}{" "}
          {rateRanking.scope
            ? `${rateRanking.scope.toLocaleLowerCase("es-PE")} `
            : "entre las carreras comparadas "}
          en este proceso.
        </p>
      )}
    </article>
  );
}

function summaryItem(
  title: string,
  ranking: ReturnType<typeof rankCareerMetric>,
  metric: CareerComparisonMetricKey,
  maximum = false,
) {
  const eligible = ranking?.eligible ?? [];
  if (eligible.length < 2) return null;
  const winners = maximum ? ranking.maximum : ranking.minimum;
  if (!winners.length) return null;
  const value = winners[0].value!;
  const tiedTitle: Partial<Record<CareerComparisonMetricKey, string>> = {
    admission_rate: "Misma tasa de ingreso",
    total_results: "Misma demanda registrada",
    minimum_admitted_score: "Mismo puntaje mínimo de ingreso",
  };
  return {
    title: ranking.tied ? (tiedTitle[metric] ?? title) : title,
    ranking,
    metric,
    value,
    names: winners.map(({ name }) => name),
  };
}

function findCurrent(detail: MajorDetail, processId: string) {
  return [...(detail.selected_processes ?? []), ...(detail.history ?? [])].find(
    (item) => String(item.process.id) === processId,
  );
}

function ScoreReferenceTable({ selected }: { selected: CareerResult[] }) {
  const anchor = selected
    .map(({ current }) => current)
    .find((record) => record && canCompareAdmittedScores(record, record));
  return (
    <div className={styles.scoreTableWrap}>
      <table className={styles.scoreTable}>
        <thead>
          <tr>
            <th scope="col">Carrera</th>
            <th scope="col">Puntaje mínimo</th>
            <th scope="col">Puntaje promedio</th>
            <th scope="col">Puntaje máximo</th>
          </tr>
        </thead>
        <tbody>
          {selected.map(({ id, item, current }) => (
            <tr key={id}>
              <th scope="row">{item?.name ?? `Carrera ${id}`}</th>
              {(["minimum_admitted_score", "average_score", "highest_score"] as const).map(
                (metric) => {
                  const hasKnownPopulation = Boolean(
                    current && canCompareAdmittedScores(current, current),
                  );
                  const comparable = Boolean(
                    current &&
                    anchor &&
                    hasKnownPopulation &&
                    canCompareAdmittedScores(anchor, current),
                  );
                  const value =
                    comparable && current ? getCareerComparisonMetricValue(current, metric) : null;
                  return (
                    <td
                      key={metric}
                      data-label={
                        metric === "minimum_admitted_score"
                          ? "Mínimo"
                          : metric === "average_score"
                            ? "Promedio"
                            : "Máximo"
                      }
                    >
                      {!current || current.total_results === 0
                        ? "Sin datos"
                        : !hasKnownPopulation
                          ? "—"
                          : !comparable
                            ? "No comparable"
                            : value === null
                              ? "—"
                              : formatCareerComparisonMetric(value, metric)}
                    </td>
                  );
                },
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
