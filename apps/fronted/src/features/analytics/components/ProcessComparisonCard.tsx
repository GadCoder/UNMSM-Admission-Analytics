import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import styles from "../pages/DashboardPage.module.css";
import {
  comparisonState,
  type ComparisonMetricValues,
  percentage,
} from "./comparisonMetrics";

type ProcessComparisonCardProps = {
  overview: ProcessOverview;
  index: number;
  metricValues: ComparisonMetricValues;
};

export function ProcessComparisonCard({ overview, index, metricValues }: ProcessComparisonCardProps) {
  const admissionRate = percentage(overview.admitted_count, overview.total_results);
  const absenceRate = percentage(overview.absent_count, overview.total_results);
  const applicantsComparison = comparisonState(metricValues.applicants[index], metricValues.applicants);

  return (
    <article className={styles.processComparisonCard}>
      <header className={styles.processComparisonHeader}>
        <div className={styles.processTotalMetric}>
          <strong
            className={applicantsComparison.isWinner ? styles.metricWinner : ""}
            title={applicantsComparison.label}
          >
            {formatNumber(overview.total_results)}
          </strong>
          <span>postulantes</span>
        </div>
        <h3>{formatProcessLabel(overview.process)}</h3>
      </header>
      <dl className={styles.processMetricList}>
        <Metric label="Admitidos" value={formatNumber(overview.admitted_count)} comparison={metricValues.admitted} index={index} />
        <Metric label="Tasa de admisión" value={`${formatNumber(admissionRate, 1)}%`} comparison={metricValues.admissionRate} index={index} />
        <Metric label="Ausentes" value={formatNumber(overview.absent_count)} comparison={metricValues.absent} index={index} />
        <Metric label="% de ausentes" value={`${formatNumber(absenceRate, 1)}%`} comparison={metricValues.absenceRate} index={index} />
        <Metric label="Promedio" value={overview.average_score === null ? "—" : formatNumber(Number(overview.average_score), 2)} comparison={metricValues.average} index={index} />
        <Metric label="Máximo" value={overview.highest_score === null ? "—" : formatNumber(Number(overview.highest_score), 2)} comparison={metricValues.highest} index={index} />
      </dl>
    </article>
  );
}

type MetricProps = {
  label: string;
  value: string;
  comparison: Array<number | null>;
  index: number;
};

function Metric({ label, value, comparison, index }: MetricProps) {
  const currentValue = comparison[index];
  const comparisonResult = comparisonState(currentValue, comparison);
  return (
    <div>
      <dt>{label}</dt>
      <dd
        className={comparisonResult.isWinner ? styles.metricWinner : ""}
        title={comparisonResult.label}
      >
        {value}
      </dd>
    </div>
  );
}
