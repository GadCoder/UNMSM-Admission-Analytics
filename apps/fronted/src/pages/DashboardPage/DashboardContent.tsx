import type { AdmissionProcess, ProcessOverview } from "../../shared/api/analytics.types";
import { formatNumber } from "./formatters";
import { Kpi } from "./Kpi";
import styles from "./DashboardPage.module.css";

type DashboardContentProps = {
  primary: ProcessOverview;
  comparisons: ProcessOverview[];
  processById: Map<string, AdmissionProcess>;
};

export function DashboardContent({ primary, comparisons, processById }: DashboardContentProps) {
  const admissionRate = primary.total_results
    ? (primary.admitted_count / primary.total_results) * 100
    : 0;

  return (
    <>
      <div className={styles.heading}>
        <div>
          <span className={styles.cardLabel}>Proceso principal</span>
          <h2>{primary.process.name}</h2>
        </div>
        <span>{primary.process.year} · etapa {primary.process.sequence}</span>
      </div>

      <div className={styles.kpis}>
        <Kpi label="Total de resultados" value={formatNumber(primary.total_results)} />
        <Kpi label="Admitidos" value={formatNumber(primary.admitted_count)} />
        <Kpi label="Ausentes" value={formatNumber(primary.absent_count)} />
        <Kpi label="Tasa de admisión" value={`${formatNumber(admissionRate, 1)}%`} />
        <Kpi label="Promedio" value={formatNumber(primary.average_score, 2)} />
        <Kpi label="Puntaje más alto" value={formatNumber(primary.highest_score, 2)} />
      </div>

      {comparisons.length > 0 && (
        <aside className={styles.comparison} aria-label="Resumen de comparación">
          <strong>Comparación</strong>
          {comparisons.map((item) => (
            <span key={item.process.id}>
              {processById.get(String(item.process.id))?.name ?? item.process.name}: {formatNumber(item.total_results)} resultados · {formatNumber(item.average_score, 2)} promedio
            </span>
          ))}
        </aside>
      )}

      <div className={styles.card}>
        <h2>Desempeño por carrera</h2>
        <div className={styles.tableWrap}>
          <table>
            <caption className={styles.visuallyHidden}>
              Indicadores por carrera para {primary.process.name}
            </caption>
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Carrera</th>
                <th scope="col">Resultados</th>
                <th scope="col">Admitidos</th>
                <th scope="col">Ausentes</th>
                <th scope="col">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {primary.majors.map((major) => (
                <tr key={major.major_id}>
                  <th scope="row">{major.major_code}</th>
                  <td>{major.major_name}</td>
                  <td>{formatNumber(major.total_results)}</td>
                  <td>{formatNumber(major.admitted_count)}</td>
                  <td>{formatNumber(major.absent_count)}</td>
                  <td>{formatNumber(major.average_score, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
