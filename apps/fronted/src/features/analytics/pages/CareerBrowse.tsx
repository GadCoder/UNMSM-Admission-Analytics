import { useSearchParams } from "react-router-dom";

import { trackUsage } from "../../../shared/telemetry/usage";

import * as api from "../api/analytics";
import type { CareerNavigationContext } from "../utils/careerNavigation";
import type { AdmissionProcess } from "../api/analytics.types";
import { CareerDiscovery } from "../components/CareerDiscovery";
import { DashboardControls } from "../components/DashboardControls";
import { DashboardFilterControls } from "../components/DashboardFilterControls";
import { SelectField } from "../components/SelectField";
import {
  formatAdmissionModalityLabel,
  modalityNameFromParam,
  modalityUrlValue,
  resolveAdmissionModality,
} from "../utils/admissionModality";
import controlsStyles from "../components/ResultsControls.module.css";
import styles from "./CareerExplorerPage.module.css";

type CareerBrowseProps = {
  areasQuery: ReturnType<typeof api.useAcademicAreas>;
  facultiesQuery: ReturnType<typeof api.useFaculties>;
  modalitiesQuery: ReturnType<typeof api.useModalities>;
  processes: AdmissionProcess[];
  processId: string;
  onSelectProcess: (id: string) => void;
  modality: string;
  navigation: CareerNavigationContext;
};

export function CareerBrowse({
  areasQuery,
  facultiesQuery,
  modalitiesQuery,
  processes,
  processId,
  onSelectProcess,
  modality,
  navigation,
}: CareerBrowseProps) {
  const [params, setParams] = useSearchParams();
  const academicArea = params.get("academic_area") ?? "";
  const faculty = params.get("faculty") ?? "";
  const query = params.get("q") ?? "";
  const showAll = params.get("view") === "all";
  const areas = areasQuery.data ?? [];
  const faculties = facultiesQuery.data ?? [];
  const overviewQuery = api.useAnalyticsOverview(processId, [], {
    academicArea,
    faculty,
    modality,
  });
  const overview = overviewQuery.data?.processes.find(
    (item) => String(item.process.id) === processId,
  );

  const updateBrowse = (name: "q" | "view", value: string, replace = false) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace, preventScrollReset: true });
  };

  const updateFilters = (nextFilters: {
    academicArea: string;
    faculty: string;
    modality: string;
  }) => {
    const previous = { academicArea, faculty, modality };
    for (const field of ["academicArea", "faculty", "modality"] as const) {
      if (previous[field] !== nextFilters[field])
        trackUsage("filter_changed", { page: "careers", filter: field, value: nextFilters[field] });
    }
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
    const defaultModalityId = modalityUrlValue(
      resolveAdmissionModality(undefined),
      modalitiesQuery.data,
    );
    if (defaultModalityId) next.set("modality", defaultModalityId);
    setParams(next, { preventScrollReset: true });
  };

  return (
    <>
      <CareerDiscovery
        filters={
          <>
            <section
              className={`${controlsStyles.toolbar} ${styles.careerToolbar}`}
              aria-label="Controles del análisis"
            >
              <DashboardControls
                processes={processes}
                primaryId={processId}
                onChange={onSelectProcess}
              />
              <div className={styles.modalityControl}>
                <SelectField
                  label="Modalidad"
                  value={modalityUrlValue(modality, modalitiesQuery.data) ?? ""}
                  onChange={(event) =>
                    updateFilters({
                      academicArea,
                      faculty,
                      modality:
                        modalityNameFromParam(event.target.value, modalitiesQuery.data) ?? modality,
                    })
                  }
                >
                  {!(modalitiesQuery.data ?? []).some((item) => item.name === modality) && (
                    <option value={modalityUrlValue(modality, modalitiesQuery.data) ?? ""}>
                      {formatAdmissionModalityLabel(modality)}
                    </option>
                  )}
                  {(modalitiesQuery.data ?? []).map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {formatAdmissionModalityLabel(item.name)}
                    </option>
                  ))}
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
            {(areasQuery.isError || facultiesQuery.isError || modalitiesQuery.isError) && (
              <p role="status" className={styles.filterError}>
                No pudimos cargar todos los filtros.{" "}
                <button
                  type="button"
                  onClick={() => {
                    void areasQuery.refetch();
                    void facultiesQuery.refetch();
                    void modalitiesQuery.refetch();
                  }}
                >
                  Reintentar filtros
                </button>
              </p>
            )}
          </>
        }
        overview={overview}
        processId={processId}
        navigation={{ ...navigation, discovery: { academicArea, faculty, query, showAll } }}
        query={query}
        onQueryChange={(query) => updateBrowse("q", query, true)}
        showAll={showAll}
        onShowAllChange={(showAll) => updateBrowse("view", showAll ? "all" : "")}
        status={
          overviewQuery.isPending || (overviewQuery.isFetching && !overview)
            ? "loading"
            : overviewQuery.isError
              ? "error"
              : "ready"
        }
        onRetry={() => void overviewQuery.refetch()}
      />
    </>
  );
}
