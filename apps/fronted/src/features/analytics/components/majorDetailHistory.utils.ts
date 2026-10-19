import type { MajorDetailProcess } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";

export const SIMILARITY_PERCENT = 5;

function admissionRate(item: MajorDetailProcess) {
  return item.total_results ? item.admitted_count / item.total_results * 100 : null;
}

function direction(current: number, previous: number) {
  if (Math.abs(current - previous) <= previous * SIMILARITY_PERCENT / 100) return "similar";
  return current > previous ? "more" : "less";
}

function describeCountChange(label: string, current: number, previous: number) {
  if (current === previous) return `${label} no variaron`;
  if (previous === 0) return `${label} pasaron de 0 a ${formatNumber(current)}`;

  const change = Math.abs((current - previous) / previous * 100);
  const magnitude = change < 0.1 ? "menos del 0.1%" : `un ${formatNumber(change, 1)}%`;
  return `${label} ${current > previous ? "aumentaron" : "disminuyeron"} ${magnitude}`;
}

function percentageChange(current: number, previous: number | undefined) {
  if (previous === undefined) return null;
  if (previous === 0) return current === 0 ? "0%" : null;
  const change = (current - previous) / previous * 100;
  return `${change > 0 ? "+" : ""}${formatNumber(change, 1)}%`;
}

function describeChanges(item: MajorDetailProcess, previous: MajorDetailProcess | undefined) {
  if (!previous) return null;
  const admitted = describeCountChange("Los ingresantes", item.admitted_count, previous.admitted_count);
  const applicants = describeCountChange("los postulantes", item.total_results, previous.total_results);
  return `${admitted}, mientras que ${applicants} respecto a ${formatProcessLabel(previous.process)}.`;
}

function takeaway(item: MajorDetailProcess, previous: MajorDetailProcess | undefined) {
  if (!item.total_results) return "Sin postulantes registrados";
  if (!previous?.total_results) return "Referencia de participación e ingreso";
  const demand = direction(item.total_results, previous.total_results);
  const admission = direction(item.admitted_count, previous.admitted_count);
  const baseline = formatProcessLabel(previous.process);
  if (demand === "similar" && admission === "similar") return `La participación y el ingreso fueron similares a los de ${baseline}.`;
  if (demand === "similar") return `Hubo ${admission === "more" ? "más" : "menos"} ingresantes que en ${baseline}, con una cantidad similar de postulantes.`;
  if (admission === "similar") return `Hubo ${demand === "more" ? "más" : "menos"} postulantes que en ${baseline}, con una cantidad similar de ingresantes.`;
  return `Hubo ${demand === "more" ? "más" : "menos"} postulantes y ${admission === "more" ? "más" : "menos"} ingresantes que en ${baseline}.`;
}

/** Build display data from newest-first processes, comparing each with the next. */
export function buildMajorHistoryEntries(items: MajorDetailProcess[], variant: "process" | "career" = "process") {
  return items.map((item, index) => {
    const previous = items[index + 1];
    const rate = admissionRate(item);
    const previousRate = previous ? admissionRate(previous) : null;
    const absenceRate = item.total_results ? item.absent_count / item.total_results * 100 : null;

    return {
      id: item.process.id,
      year: item.process.year,
      label: formatProcessLabel(item.process),
      startsYear: index === 0 || items[index - 1].process.year !== item.process.year,
      takeaway: takeaway(item, previous),
      changeDescription: describeChanges(item, previous),
      applicants: formatNumber(item.total_results),
      admitted: formatNumber(item.admitted_count),
      applicantChange: percentageChange(item.total_results, previous?.total_results),
      admittedChange: percentageChange(item.admitted_count, previous?.admitted_count),
      admission: {
        rate: rate === null ? null : formatNumber(rate, 1),
        previousRate: previousRate === null ? null : formatNumber(previousRate, 1),
        previousLabel: previous ? formatProcessLabel(previous.process) : null,
        reference: previousRate !== null ? null : previous
          ? "El proceso anterior no tiene postulantes para comparar."
          : "Primer proceso disponible; sin comparación anterior.",
      },
      details: [
        ...(variant === "career" ? [{ label: "Puntaje mínimo de ingreso", value: formatNumber(item.minimum_admitted_score != null && Number.isFinite(item.minimum_admitted_score) ? item.minimum_admitted_score : null, 2) }] : []),
        { label: "Puntaje promedio", value: formatNumber(item.average_score, 2) },
        { label: "Puntaje máximo", value: formatNumber(item.highest_score, 2) },
        ...(variant === "process" ? [{ label: "Ausentes", value: `${formatNumber(item.absent_count)}${absenceRate === null ? "" : ` (${formatNumber(absenceRate, 1)}%)`}` }] : []),
      ],
    };
  });
}

export type MajorHistoryEntryData = ReturnType<typeof buildMajorHistoryEntries>[number];
