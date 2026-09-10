import styles from "../pages/DashboardPage.module.css";

type KpiProps = {
  label: string;
  value: string;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    context: string;
    isPositive: boolean;
  };
};

export function Kpi({ label, value, trend }: KpiProps) {
  return (
    <article className={styles.kpi}>
      <span>{label}</span>
      <strong>{value}</strong>
      {trend && (
        <div className={`${styles.kpiTrend} ${trend.isPositive ? styles.kpiTrendPositive : styles.kpiTrendNegative}`}>
          <span aria-label={`${trend.direction === "up" ? "Subió" : trend.direction === "down" ? "Bajó" : "Sin cambio"}: ${trend.value}`}>
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.value}
          </span>
          <small>{trend.context}</small>
        </div>
      )}
    </article>
  );
}
