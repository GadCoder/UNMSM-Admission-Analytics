import { Link, NavLink, Outlet } from "react-router-dom";

import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          <span className={styles.brandMark}>UN</span>
          <span>
            <strong>Admisión UNMSM</strong>
            <small>Admisión · datos claros</small>
          </span>
        </Link>
        <nav aria-label="Navegación principal">
          <NavLink to="/" end>Resumen</NavLink>
          <NavLink to="/resultados">Postulantes</NavLink>
        </nav>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
