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
};

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
    max: Math.max(...applicantValues, 1),
  };
  const admissionRateRange = {
    min: Math.min(...admissionRates, 0),
    max: Math.max(...admissionRates, 1),
  };

  return {
    applicantRange,
    admissionRateRange,
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
