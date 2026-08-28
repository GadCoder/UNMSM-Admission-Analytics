import { Link, Outlet } from "react-router-dom";

import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          <span className={styles.brandMark}>UN</span>
          <span>
            <strong>Resultados UNMSM</strong>
            <small>Admisión, datos claros</small>
          </span>
        </Link>
        <nav aria-label="Navegación principal">
          <Link to="/">Resumen</Link>
          <Link to="/resultados">Resultados</Link>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
