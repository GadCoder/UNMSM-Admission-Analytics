import styles from "../pages/DashboardPage.module.css";
import { KpiTrend, type KpiTrendProps } from "./KpiTrend";

type KpiProps = {
  label: string;
  value: string;
  trend?: KpiTrendProps;
};

export function Kpi({ label, value, trend }: KpiProps) {
  return (
    <article className={styles.kpi}>
      <span>{label}</span>
      <strong>{value}</strong>
      {trend && <KpiTrend {...trend} />}
    </article>
  );
}
