import styles from "../pages/DashboardPage.module.css";

export type KpiTrendProps = {
  direction: "up" | "down" | "flat" | "unavailable";
  value: string;
  context: string;
  isPositive: boolean;
  neutral?: boolean;
};

export function KpiTrend({ direction, value, context, isPositive, neutral = false }: KpiTrendProps) {
  const directionLabel = direction === "unavailable" ? "Comparación no disponible" : direction === "up" ? "Subió" : direction === "down" ? "Bajó" : "Sin cambio";
  const directionIcon = direction === "unavailable" ? "—" : direction === "up" ? "↑" : direction === "down" ? "↓" : "→";

  return (
    <div className={`${styles.kpiTrendRail} ${neutral ? styles.kpiTrendNeutral : isPositive ? styles.kpiTrendPositive : styles.kpiTrendNegative}`}>
      <span className={styles.kpiTrendArrow} aria-label={`${directionLabel}: ${value}`}>
        {directionIcon}
      </span>
      <small title={context}>{value}</small>
    </div>
  );
}
