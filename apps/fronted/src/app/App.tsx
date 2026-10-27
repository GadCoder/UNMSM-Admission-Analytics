import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import * as api from "../features/analytics/api/analytics";
import { readDashboardView } from "../features/analytics/utils/dashboardSessionState";
import { buildAppNavigation } from "./appNavigation";
import styles from "./App.module.css";

const headerByPage = {
  processes: {
    compact: false,
    description: "Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.",
  },
  careers: {
    compact: true,
    description: "Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.",
  },
  comparison: {
    compact: true,
    description: "Explora los resultados históricos por proceso y modalidad.",
  },
} as const;

export function App() {
  const { pathname, search } = useLocation();
  const modalitiesQuery = api.useModalities();
  const navigation = buildAppNavigation({
    pathname,
    search,
    modalities: modalitiesQuery.data,
    savedModality: readDashboardView().filters.modality,
  });
  const header = headerByPage[navigation.page];
  const HeaderTitle = header.compact ? "div" : "h1";

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link className={styles.brand} to={navigation.processHref} aria-label="Inicio">
          <img className={styles.brandLogo} src="https://assets.resultados-unmsm.com/brand/unmsm-2e787805.png" alt="UNMSM" width="48" height="56" />
        </Link>
        <div>
          <HeaderTitle className={header.compact ? styles.title : undefined}>Resultados de admisión</HeaderTitle>
          <p>{header.description}</p>
        </div>
        <nav className={styles.headerNav} aria-label="Navegación principal">
          <NavLink to={navigation.processHref} end className={({ isActive }) => isActive ? styles.activeLink : undefined}>Resultados por proceso</NavLink>
          <NavLink to={navigation.discoveryHref} className={({ isActive }) => isActive ? styles.activeLink : undefined}>Explorar carreras</NavLink>
          <NavLink to={navigation.comparisonHref} className={({ isActive }) => isActive ? styles.activeLink : undefined}>Comparar carreras</NavLink>
        </nav>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
