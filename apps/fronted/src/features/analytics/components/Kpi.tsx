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
      <div className={styles.kpiValueBlock}>
        <span className={styles.kpiLabel}>{label}</span>
        <div className={styles.kpiValuePrimary}>
          <strong>{value}</strong>
        </div>
        {trend && <KpiTrend {...trend} />}
      </div>
    </article>
  );
}
