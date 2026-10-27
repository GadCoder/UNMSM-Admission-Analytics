import styles from "../pages/DashboardPage.module.css";
import { KpiTrend, type KpiTrendProps } from "./KpiTrend";

type KpiProps = {
  label: string;
  value: string;
  trend?: KpiTrendProps;
  description?: string;
  footnoteId?: string;
};

export function Kpi({ label, value, trend, description, footnoteId }: KpiProps) {
  return (
    <article
      className={styles.kpi}
      title={description}
      aria-description={description}
      aria-describedby={footnoteId}
    >
      <div className={styles.kpiValueBlock}>
        <span className={styles.kpiLabel}>
          {label}
          {footnoteId && <sup aria-hidden="true">*</sup>}
        </span>
        <div className={styles.kpiValuePrimary}>
          <strong>{value}</strong>
        </div>
        {trend && <KpiTrend {...trend} />}
      </div>
    </article>
  );
}
