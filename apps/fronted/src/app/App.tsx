import { Link, Outlet } from "react-router-dom";

import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/" aria-label="Inicio">
          <img className={styles.brandLogo} src="https://assets.resultados-unmsm.com/brand/unmsm-2e787805.png" alt="UNMSM" />
        </Link>
        <div>
          <h1>Resultados de admisión</h1>
          <p>Consulta los resultados de cada proceso: postulantes, ingresantes y demanda por carrera.</p>
        </div>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
