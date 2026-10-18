import type { MajorOverview } from "../api/analytics.types";

export type RankingMetrics = {
  share: number;
  admissionRate: number;
};

export function calculateMetrics(
  major: MajorOverview,
  totalApplicants: number,
): RankingMetrics {
  return {
    share: totalApplicants > 0 ? (major.total_results / totalApplicants) * 100 : 0,
    admissionRate:
      major.total_results > 0
        ? (major.admitted_count / major.total_results) * 100
        : 0,
  };
}

export type DemandChartPoint = {
  major: MajorOverview;
  rank: number;
  admissionRate: number;
  left: number;
  bottom: number;
};

export type DemandChartModel = {
  points: DemandChartPoint[];
  applicantRange: { min: number; max: number };
  admissionRateRange: { min: number; max: number };
  applicantTicks: number[];
  admissionRateTicks: number[];
};

function niceAxisMaximum(value: number) {
  const target = Math.max(value * 1.1, 1);
  const rawStep = target / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalizedStep = rawStep / magnitude;
  const stepSize = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((step) => step >= normalizedStep) ?? 10;
  return Number((stepSize * magnitude * 4).toPrecision(12));
}

function createTicks({ max }: { min: number; max: number }) {
  return Array.from({ length: 5 }, (_, index) => Number(((max * index) / 4).toPrecision(12)));
}

export function describeDemandInsight(points: DemandChartPoint[]) {
  if (points.length === 0) return "";

  const highestDemand = points.reduce((highest, point) =>
    point.major.total_results > highest.major.total_results ? point : highest,
  );
  const lowestAdmission = points.reduce((lowest, point) =>
    point.admissionRate < lowest.admissionRate ? point : lowest,
  );
  const context = points.length === 1 ? "la carrera representada" : `las ${points.length} carreras`;
  const demand = `${highestDemand.major.major_name} tiene la mayor demanda (${highestDemand.major.total_results.toLocaleString("es-PE")} postulantes)`;

  if (points.length === 1) return `${demand}.`;
  const lowestRate = `${lowestAdmission.admissionRate.toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`;
  const admission = lowestAdmission.major.major_id === highestDemand.major.major_id
    ? `y el menor porcentaje de ingreso (${lowestRate})`
    : `y ${lowestAdmission.major.major_name} presenta el menor porcentaje de ingreso (${lowestRate})`;
  return `${demand} ${admission} entre ${context}.`;
}

export function getTopMajors(majors: MajorOverview[]): MajorOverview[] {
  return [...majors]
    .sort((left, right) => right.total_results - left.total_results)
    .slice(0, 6);
}

function plotPosition(value: number, min: number, max: number) {
  if (min === max) return 50;
  return 8 + ((value - min) / (max - min)) * 84;
}

export function createDemandChartModel(majors: MajorOverview[]): DemandChartModel {
  const applicantValues = majors.map((major) => major.total_results);
  const admissionRates = majors.map((major) => major.total_results > 0
    ? (major.admitted_count / major.total_results) * 100
    : 0);
  const applicantRange = {
    min: Math.min(...applicantValues, 0),
    max: niceAxisMaximum(Math.max(...applicantValues, 1)),
  };
  const admissionRateRange = {
    min: Math.min(...admissionRates, 0),
    max: niceAxisMaximum(Math.max(...admissionRates, 1)),
  };

  return {
    applicantRange,
    admissionRateRange,
    applicantTicks: createTicks(applicantRange),
    admissionRateTicks: createTicks(admissionRateRange),
    points: majors.map((major, index) => {
      const admissionRate = admissionRates[index];
      return {
        major,
        rank: index + 1,
        admissionRate,
        left: plotPosition(major.total_results, applicantRange.min, applicantRange.max),
        bottom: plotPosition(admissionRate, admissionRateRange.min, admissionRateRange.max),
      };
    }),
  };
}
