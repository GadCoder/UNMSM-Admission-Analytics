import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import * as api from "../features/analytics/api/analytics";
import { DEFAULT_ADMISSION_MODALITY, modalityNameFromParam, modalityUrlValue } from "../features/analytics/utils/admissionModality";
import { readDashboardView } from "../features/analytics/utils/dashboardSessionState";
import styles from "./App.module.css";

export function App() {
  const { pathname, search } = useLocation();
  const isCareers = pathname.startsWith("/carreras");
  const params = new URLSearchParams(search);
  const modalitiesQuery = api.useModalities();
  const rawModality = params.get("modality");
  const currentModality = rawModality
    ? modalityNameFromParam(rawModality, modalitiesQuery.data)
    : isCareers ? DEFAULT_ADMISSION_MODALITY : readDashboardView().filters.modality;
  const sharedParams = new URLSearchParams();
  const process = params.get("process");
  if (process) sharedParams.set("process", process);
  const modalityId = rawModality && /^\d+$/.test(rawModality)
    ? rawModality
    : currentModality ? modalityUrlValue(currentModality, modalitiesQuery.data) : undefined;
  if (modalityId) sharedParams.set("modality", modalityId);
  const query = sharedParams.size ? `?${sharedParams.toString()}` : "";
  const discoveryParams = new URLSearchParams(sharedParams);
  if (isCareers) {
    for (const key of ["academic_area", "faculty", "q", "view", "returnTo"]) {
      const value = params.get(key);
      if (value) discoveryParams.set(key, value);
    }
  }
  const discoveryQuery = discoveryParams.size ? `?${discoveryParams.toString()}` : "";

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link className={styles.brand} to={`/${query}`} aria-label="Inicio">
          <img className={styles.brandLogo} src="https://assets.resultados-unmsm.com/brand/unmsm-2e787805.png" alt="UNMSM" width="48" height="56" />
        </Link>
        <div>
          {isCareers ? <div className={styles.title}>Resultados de admisión</div> : <h1>Resultados de admisión</h1>}
          <p>Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.</p>
        </div>
        <nav className={styles.headerNav} aria-label="Navegación principal">
          <NavLink to={`/${query}`} end className={({ isActive }) => isActive ? styles.activeLink : undefined}>Resultados por proceso</NavLink>
          <NavLink to={`/carreras${discoveryQuery}`} className={({ isActive }) => isActive ? styles.activeLink : undefined}>Explorar carreras</NavLink>
        </nav>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
