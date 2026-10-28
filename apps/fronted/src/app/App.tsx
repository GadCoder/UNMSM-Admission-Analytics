import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { trackUsage, type UsagePage } from "../shared/telemetry/usage";

import * as api from "../features/analytics/api/analytics";
import { readDashboardView } from "../features/analytics/utils/dashboardSessionState";
import { buildAppNavigation } from "./appNavigation";
import { Footer } from "./Footer";
import styles from "./App.module.css";

const headerByPage = {
  processes: {
    compact: false,
    description: "Explora los resultados de admisión, las tendencias y la demanda de cada carrera.",
  },
  careers: {
    compact: true,
    description: "Explora los resultados de admisión, las tendencias y la demanda de cada carrera.",
  },
  comparison: {
    compact: true,
    description: "Explora los resultados históricos por proceso y modalidad.",
  },
} as const;

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { pathname, search } = useLocation();
  const modalitiesQuery = api.useModalities();
  const page: UsagePage =
    pathname === "/" || pathname === "/resultados"
      ? "processes"
      : /^\/carreras\/\d+\/?$/.test(pathname)
        ? "career_detail"
        : pathname === "/carreras"
          ? "careers"
          : pathname === "/comparar-carreras"
            ? "comparison"
            : "not_found";
  useEffect(() => {
    trackUsage("page_viewed", { page });
  }, [page]);

  const navigation = buildAppNavigation({
    pathname,
    search,
    modalities: modalitiesQuery.data,
    savedModality: readDashboardView().filters.modality,
  });
  const header = headerByPage[navigation.page];
  const HeaderTitle = header.compact ? "div" : "h1";

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("[data-mobile-navigation]")) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link className={styles.brand} to={navigation.processHref} aria-label="Inicio">
          <img
            className={styles.brandLogo}
            src="https://assets.resultados-unmsm.com/brand/unmsm-2e787805.png"
            alt="UNMSM"
            width="48"
            height="56"
          />
        </Link>
        <div>
          <HeaderTitle className={header.compact ? styles.title : undefined}>
            Resultados UNMSM
          </HeaderTitle>
          <p>{header.description}</p>
        </div>
        <button
          ref={menuButtonRef}
          className={styles.menuButton}
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          data-mobile-navigation
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
        <nav
          id="primary-navigation"
          className={`${styles.headerNav} ${menuOpen ? styles.headerNavOpen : ""}`}
          aria-label="Navegación principal"
          data-mobile-navigation
        >
          <NavLink
            to={navigation.processHref}
            end
            className={({ isActive }) => (isActive ? styles.activeLink : undefined)}
            onClick={() => setMenuOpen(false)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7" />
            </svg>
            Resultados por proceso
          </NavLink>
          <NavLink
            to={navigation.discoveryHref}
            className={({ isActive }) => (isActive ? styles.activeLink : undefined)}
            onClick={() => setMenuOpen(false)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.3" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            Explorar carreras
          </NavLink>
          <NavLink
            to={navigation.comparisonHref}
            className={({ isActive }) => (isActive ? styles.activeLink : undefined)}
            onClick={() => setMenuOpen(false)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 5h14v14H5zM9 9h6M9 12h6M9 15h3" />
            </svg>
            Comparar carreras
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
