import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import styles from "../pages/DashboardPage.module.css";

type MajorBreakdownProps = {
  overview: ProcessOverview;
};

export function MajorBreakdown({ overview }: MajorBreakdownProps) {
  return (
    <div className={styles.card}>
      <h2>Desempeño por carrera</h2>
      <div className={styles.tableWrap}>
        <table>
          <caption className={styles.visuallyHidden}>
            Indicadores por carrera para {overview.process.name}
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
            {overview.majors.map((major) => (
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
  );
}
