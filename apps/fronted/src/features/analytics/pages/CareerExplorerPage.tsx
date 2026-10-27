import { useEffect } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";

import * as api from "../api/analytics";
import { DashboardControls } from "../components/DashboardControls";
import { SelectField } from "../components/SelectField";
import { formatAdmissionModalityLabel, modalityNameFromParam, modalityUrlValue, resolveAdmissionModality } from "../utils/admissionModality";
import dashboardStyles from "./DashboardPage.module.css";
import { CareerBrowse } from "./CareerBrowse";
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
  if (!modality) {
    if (modalitiesQuery.isPending) return <p role="status" className={styles.notice}>Cargando modalidades…</p>;
    if (modalitiesQuery.isError) return <div role="alert" className={styles.notice}>
      <p>No pudimos cargar las modalidades.</p>
      <button type="button" onClick={() => void modalitiesQuery.refetch()}>Reintentar modalidades</button>
    </div>;
    const fallbackModalityId = modalityUrlValue(resolveAdmissionModality(undefined), modalities) ?? (modalities[0] ? String(modalities[0].id) : undefined);
    return <div role="alert" className={styles.notice}>
      <p>La modalidad seleccionada no está disponible.</p>
      {fallbackModalityId && <button type="button" onClick={() => updateContext("modality", fallbackModalityId)}>Usar una modalidad disponible</button>}
    </div>;
  }

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
    /> : <CareerBrowse
      processes={processes}
      processId={processId}
      onSelectProcess={(id) => updateContext("process", id)}
      modality={modality}
      navigation={{ modalityId: modalityParam || undefined, processReturnTo: processOrigin }}
    />}
  </div>;
}
