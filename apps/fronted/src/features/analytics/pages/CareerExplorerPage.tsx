import { useEffect } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";

import * as api from "../api/analytics";
import { CareerDiscovery } from "../components/CareerDiscovery";
import { DashboardControls } from "../components/DashboardControls";
import { DashboardFilterControls } from "../components/DashboardFilterControls";
import { SelectField } from "../components/SelectField";
import { formatAdmissionModalityLabel, modalityNameFromParam, modalityUrlValue, resolveAdmissionModality } from "../utils/admissionModality";
import controlsStyles from "../components/ResultsControls.module.css";
import type { AdmissionProcess } from "../api/analytics.types";
import dashboardStyles from "./DashboardPage.module.css";
import { MajorDetailContent } from "./MajorDetailPage";
import styles from "./CareerExplorerPage.module.css";

export function CareerExplorerPage() {
  const { majorId } = useParams();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const processesQuery = api.usePublishedProcesses();
  const modalitiesQuery = api.useModalities();
  const processes = processesQuery.data ?? [];
  const processId = params.get("process") ?? (processes[0] ? String(processes[0].id) : "");
  const modalities = modalitiesQuery.data ?? [];
  const rawModality = params.get("modality");
  const resolvedModality = modalityNameFromParam(rawModality, modalities);
  const modality = resolvedModality ?? (rawModality ? undefined : resolveAdmissionModality(undefined));
  const modalityParam = modality ? modalityUrlValue(modality, modalities) : rawModality ?? "";

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (processId) next.set("process", processId);
    if (modalityParam) next.set("modality", modalityParam);
    next.delete("compare");
    if (next.toString() !== params.toString()) setParams(next, { replace: true, state: location.state });
  }, [location.state, modalityParam, params, processId, setParams]);

  const updateContext = (name: "process" | "modality", value: string) => {
    const next = new URLSearchParams(params);
    next.set(name, value);
    setParams(next, { preventScrollReset: true });
  };
  const discoveryParams = new URLSearchParams(params);
  if (processId) discoveryParams.set("process", processId);
  if (modalityParam) discoveryParams.set("modality", modalityParam);
  const discoveryHref = `/carreras?${discoveryParams}`;
  const origin = params.get("returnTo");
  const processOrigin = origin?.startsWith("/?") ? origin : undefined;

  if (processesQuery.isPending && !processesQuery.data) return <p role="status">Cargando procesos…</p>;
  if (processesQuery.isError && !processesQuery.data) return <div role="alert" className={styles.notice}>
    <p>No pudimos cargar los procesos de admisión.</p>
    <button type="button" onClick={() => void processesQuery.refetch()}>Reintentar</button>
  </div>;
  if (!processes.length) return <p className={styles.notice}>Aún no hay procesos publicados para explorar carreras.</p>;
  if (!processes.some((process) => String(process.id) === processId)) return <div role="alert" className={styles.notice}>
    <p>El proceso seleccionado no está disponible.</p>
    <button type="button" onClick={() => updateContext("process", String(processes[0].id))}>Usar el proceso más reciente</button>
  </div>;
  if (!modality) return <p role="status" className={styles.notice}>{modalitiesQuery.isPending ? "Cargando modalidades…" : "La modalidad seleccionada no está disponible."}</p>;

  return <div className={styles.page}>
    {majorId && <div className={styles.detailNavigation}>
      <Link className={styles.changeCareer} to={discoveryHref}>← Cambiar carrera</Link>
      {processOrigin && <Link to={processOrigin}>Volver a resultados del proceso</Link>}
    </div>}
    {modalitiesQuery.isError && <div role="status" className={styles.notice}>
      <span>No pudimos cargar las otras modalidades. Puedes consultar la seleccionada.</span>
      <button type="button" onClick={() => void modalitiesQuery.refetch()}>Reintentar modalidades</button>
    </div>}
    {majorId ? <MajorDetailContent
      majorId={majorId}
      processId={processId}
      modality={modality}
      focusHeading={Boolean(location.state?.fromDiscovery)}
      headerControls={<div className={dashboardStyles.careerHeaderControls} aria-label="Proceso y modalidad">
        <DashboardControls processes={processes} primaryId={processId} onChange={(id) => updateContext("process", id)} />
        <SelectField wrapperClassName={dashboardStyles.detailModalityControl} label="Modalidad" value={modalityParam} onChange={(event) => updateContext("modality", event.target.value)}>
          {!modalities.some((item) => item.name === modality) && <option value={modalityParam}>{formatAdmissionModalityLabel(modality)}</option>}
          {modalities.map((item) => <option key={item.id} value={String(item.id)}>{formatAdmissionModalityLabel(item.name)}</option>)}
        </SelectField>
      </div>}
      onSelectProcess={(id) => updateContext("process", String(id))}
    /> : <CareerBrowse processes={processes} processId={processId} onSelectProcess={(id) => updateContext("process", id)} modality={modality} returnTo={discoveryHref} />}
  </div>;
}

function CareerBrowse({ processes, processId, onSelectProcess, modality, returnTo }: { processes: AdmissionProcess[]; processId: string; onSelectProcess: (id: string) => void; modality: string; returnTo: string }) {
  const [params, setParams] = useSearchParams();
  const areasQuery = api.useAcademicAreas();
  const facultiesQuery = api.useFaculties();
  const modalitiesQuery = api.useModalities();
  const academicArea = params.get("academic_area") ?? "";
  const faculty = params.get("faculty") ?? "";
  const areas = areasQuery.data ?? [];
  const faculties = facultiesQuery.data ?? [];
  const overviewQuery = api.useAnalyticsOverview(processId, [], { academicArea, faculty, modality });
  const overview = overviewQuery.data?.processes.find((item) => String(item.process.id) === processId);

  const updateBrowse = (name: string, value: string, replace = false) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name === "academic_area") next.delete("faculty");
    if (name === "faculty" && value) {
      const areaId = faculties.find((item) => item.code === value)?.academic_area_id;
      const area = areas.find((item) => item.id === areaId);
      if (area) next.set("academic_area", area.code);
    }
    setParams(next, { replace, preventScrollReset: true });
  };
  const updateFilters = (nextFilters: { academicArea: string; faculty: string; modality: string }) => {
    const next = new URLSearchParams(params);
    if (nextFilters.academicArea) next.set("academic_area", nextFilters.academicArea);
    else next.delete("academic_area");
    if (nextFilters.faculty) next.set("faculty", nextFilters.faculty);
    else next.delete("faculty");
    const nextModalityId = modalityUrlValue(nextFilters.modality, modalitiesQuery.data);
    if (nextModalityId) next.set("modality", nextModalityId);
    setParams(next, { preventScrollReset: true });
  };
  const resetBrowseFilters = () => {
    const next = new URLSearchParams(params);
    next.delete("academic_area");
    next.delete("faculty");
    const defaultModalityId = modalityUrlValue(resolveAdmissionModality(undefined), modalitiesQuery.data);
    if (defaultModalityId) next.set("modality", defaultModalityId);
    setParams(next, { preventScrollReset: true });
  };

  return <>
    <section className={`${controlsStyles.toolbar} ${styles.careerToolbar}`} aria-label="Controles del análisis">
      <DashboardControls processes={processes} primaryId={processId} onChange={onSelectProcess} />
      <div className={styles.modalityControl}>
        <SelectField label="Modalidad" value={modalityUrlValue(modality, modalitiesQuery.data) ?? ""} onChange={(event) => updateFilters({ academicArea, faculty, modality: modalityNameFromParam(event.target.value, modalitiesQuery.data) ?? modality })}>
          {!((modalitiesQuery.data ?? []).some((item) => item.name === modality)) && <option value={modalityUrlValue(modality, modalitiesQuery.data) ?? ""}>{formatAdmissionModalityLabel(modality)}</option>}
          {(modalitiesQuery.data ?? []).map((item) => <option key={item.id} value={String(item.id)}>{formatAdmissionModalityLabel(item.name)}</option>)}
        </SelectField>
      </div>
      <div className={`${controlsStyles.filterAction} ${styles.filterControl}`}>
        <DashboardFilterControls
          areas={areas}
          faculties={faculties}
          modalities={modalitiesQuery.data ?? []}
          filters={{ academicArea, faculty, modality }}
          onChange={updateFilters}
          onReset={resetBrowseFilters}
        />
      </div>
    </section>
    {(areasQuery.isError || facultiesQuery.isError || modalitiesQuery.isError) && <p role="status" className={styles.filterError}>
      No pudimos cargar todos los filtros. <button type="button" onClick={() => { void areasQuery.refetch(); void facultiesQuery.refetch(); void modalitiesQuery.refetch(); }}>Reintentar filtros</button>
    </p>}
    <CareerDiscovery
      overview={overview}
      processId={processId}
      modality={modality}
      returnTo={returnTo}
      query={params.get("q") ?? ""}
      onQueryChange={(query) => updateBrowse("q", query, true)}
      showAll={params.get("view") === "all"}
      onShowAllChange={(showAll) => updateBrowse("view", showAll ? "all" : "")}
      status={overviewQuery.isPending || (overviewQuery.isFetching && !overview) ? "loading" : overviewQuery.isError ? "error" : "ready"}
      onRetry={() => void overviewQuery.refetch()}
    />
  </>;
}
