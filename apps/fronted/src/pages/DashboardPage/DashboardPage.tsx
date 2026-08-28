import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>Admisión UNMSM</p>
      <h1>Resultados que se entienden.</h1>
      <p className={styles.intro}>
        Explora procesos de admisión, puntajes y tendencias de la Universidad Nacional Mayor de San Marcos.
      </p>
      <div className={styles.card}>
        <span className={styles.cardLabel}>Primera etapa</span>
        <h2>El dashboard está tomando forma</h2>
        <p>
          Esta base ya tiene navegación, estilos y estado remoto preparados para conectar los datos reales de la API.
        </p>
      </div>
    </section>
  );
}
