import type { ProcessOverview } from "../api/analytics.types";
import { formatNumber } from "../utils/formatters";
import { formatProcessLabel } from "../utils/processLabels";
import { percentage } from "./comparisonMetrics";

export type ComparisonInsight = { metric: string; direction: "up" | "down" | "neutral"; text: string };

function sequenceOrder(sequence: string) {
  const normalized = sequence.trim().toUpperCase();
  const suffix = normalized.match(/-(\d+)$/)?.[1];
  const value = suffix ?? normalized;
  const roman: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
  return roman[value] ?? Number(value);
}

function chronological(a: ProcessOverview, b: ProcessOverview) {
  return a.process.year - b.process.year || sequenceOrder(a.process.sequence) - sequenceOrder(b.process.sequence);
}

function latestPair(overviews: ProcessOverview[]) {
  const sorted = [...overviews].sort(chronological);
  return sorted.length >= 2 ? [sorted.at(-2)!, sorted.at(-1)!] : null;
}

function rate(overview: ProcessOverview, key: "admitted_count" | "absent_count") {
  return percentage(overview[key], overview.total_results);
}

function formatRate(value: number) {
  return value.toFixed(1);
}

export function buildComparisonInsights(overviews: ProcessOverview[]): ComparisonInsight[] {
  const pair = latestPair(overviews);
  if (!pair) return [];
  const [previous, current] = pair;
  const previousLabel = formatProcessLabel(previous.process);
  const currentLabel = formatProcessLabel(current.process);
  const applicantsChange = percentage(current.total_results - previous.total_results, previous.total_results);
  const admissionRate = rate(current, "admitted_count");
  const previousAdmissionRate = rate(previous, "admitted_count");
  const absentRate = rate(current, "absent_count");
  const previousAbsentRate = rate(previous, "absent_count");

  return [
    {
      metric: "Postulantes",
      direction: applicantsChange > 0 ? "up" : applicantsChange < 0 ? "down" : "neutral",
      text: `${currentLabel} registró ${formatNumber(current.total_results)} postulantes, ${formatNumber(Math.abs(applicantsChange), 1)}% ${applicantsChange >= 0 ? "más" : "menos"} que ${previousLabel}.`,
    },
    {
      metric: "Tasa de ingreso",
      direction: admissionRate > previousAdmissionRate ? "up" : admissionRate < previousAdmissionRate ? "down" : "neutral",
      text: `${currentLabel} alcanzó ${formatRate(admissionRate)}%, frente al ${formatRate(previousAdmissionRate)}% de ${previousLabel}.`,
    },
    {
      metric: "Ausentismo",
      direction: absentRate > previousAbsentRate ? "up" : absentRate < previousAbsentRate ? "down" : "neutral",
      text: absentRate === previousAbsentRate
        ? `La tasa se mantuvo en ${formatRate(absentRate)}% entre ${previousLabel} y ${currentLabel}.`
        : `La tasa ${absentRate < previousAbsentRate ? "cayó" : "subió"} de ${formatRate(previousAbsentRate)}% en ${previousLabel} a ${formatRate(absentRate)}% en ${currentLabel}.`,
    },
  ];
}
