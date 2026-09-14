import { Link, Outlet } from "react-router-dom";

import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          <span className={styles.brandMark}>UNMSM</span>
          <span>
            <strong>Admisión UNMSM</strong>
            <small>Resultados oficiales</small>
          </span>
        </Link>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
