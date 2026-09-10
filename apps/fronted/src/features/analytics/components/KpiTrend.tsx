import styles from "../pages/DashboardPage.module.css";

export type KpiTrendProps = {
  direction: "up" | "down" | "flat";
  value: string;
  context: string;
  isPositive: boolean;
};

export function KpiTrend({ direction, value, context, isPositive }: KpiTrendProps) {
  const directionLabel = direction === "up" ? "Subió" : direction === "down" ? "Bajó" : "Sin cambio";
  const directionIcon = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";

  return (
    <div className={`${styles.kpiTrend} ${isPositive ? styles.kpiTrendPositive : styles.kpiTrendNegative}`}>
      <span aria-label={`${directionLabel}: ${value}`}>
        {directionIcon} {value}
      </span>
      <small>{context}</small>
    </div>
  );
}
