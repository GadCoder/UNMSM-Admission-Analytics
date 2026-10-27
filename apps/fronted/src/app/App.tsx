import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import * as api from "../features/analytics/api/analytics";
import { readDashboardView } from "../features/analytics/utils/dashboardSessionState";
import { buildAppNavigation } from "./appNavigation";
import styles from "./App.module.css";

export function App() {
  const { pathname, search } = useLocation();
  const modalitiesQuery = api.useModalities();
  const { isCareers, processHref, discoveryHref } = buildAppNavigation({
    pathname,
    search,
    modalities: modalitiesQuery.data,
    savedModality: readDashboardView().filters.modality,
  });

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link className={styles.brand} to={processHref} aria-label="Inicio">
          <img className={styles.brandLogo} src="https://assets.resultados-unmsm.com/brand/unmsm-2e787805.png" alt="UNMSM" width="48" height="56" />
        </Link>
        <div>
          {isCareers ? <div className={styles.title}>Resultados de admisión</div> : <h1>Resultados de admisión</h1>}
          <p>Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.</p>
        </div>
        <nav className={styles.headerNav} aria-label="Navegación principal">
          <NavLink to={processHref} end className={({ isActive }) => isActive ? styles.activeLink : undefined}>Resultados por proceso</NavLink>
          <NavLink to={discoveryHref} className={({ isActive }) => isActive ? styles.activeLink : undefined}>Explorar carreras</NavLink>
        </nav>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
