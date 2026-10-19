import styles from "../pages/DashboardPage.module.css";
import { KpiTrend, type KpiTrendProps } from "./KpiTrend";

type KpiProps = {
  label: string;
  value: string;
  trend?: KpiTrendProps;
  description?: string;
};

export function Kpi({ label, value, trend, description }: KpiProps) {
  return (
    <article className={styles.kpi} title={description} aria-description={description}>
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
