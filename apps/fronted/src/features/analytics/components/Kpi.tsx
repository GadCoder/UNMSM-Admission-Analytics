import styles from "../pages/DashboardPage.module.css";

type KpiProps = {
  label: string;
  value: string;
};

export function Kpi({ label, value }: KpiProps) {
  return (
    <article className={styles.kpi}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
