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

export function getTopMajors(majors: MajorOverview[]): MajorOverview[] {
  return [...majors]
    .sort((left, right) => right.total_results - left.total_results)
    .slice(0, 6);
}
