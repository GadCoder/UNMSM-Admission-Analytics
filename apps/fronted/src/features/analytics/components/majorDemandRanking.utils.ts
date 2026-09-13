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
  share: number;
  admissionRate: number;
  left: number;
  bottom: number;
};

export type DemandChartModel = {
  points: DemandChartPoint[];
  mostDemanded?: MajorOverview;
  highestAdmission?: MajorOverview;
};

export function getTopMajors(majors: MajorOverview[]): MajorOverview[] {
  return [...majors]
    .sort((left, right) => right.total_results - left.total_results)
    .slice(0, 6);
}

export function createDemandChartModel(
  majors: MajorOverview[],
  totalApplicants: number,
): DemandChartModel {
  const metrics = majors.map((major) => calculateMetrics(major, totalApplicants));
  const maxShare = Math.max(...metrics.map(({ share }) => share), 1);
  const maxAdmissionRate = Math.max(
    ...metrics.map(({ admissionRate }) => admissionRate),
    1,
  );
  const points = majors.map((major, index) => {
    const { share, admissionRate } = calculateMetrics(major, totalApplicants);
    return {
      major,
      rank: index + 1,
      share,
      admissionRate,
      left: Math.min(96, Math.max(4, (share / maxShare) * 100)),
      bottom: Math.min(96, Math.max(4, (admissionRate / maxAdmissionRate) * 100)),
    };
  });
  const highestAdmission = majors.reduce<MajorOverview | undefined>(
    (current, major) => {
      if (!current) return major;
      const currentRate = calculateMetrics(current, totalApplicants).admissionRate;
      const majorRate = calculateMetrics(major, totalApplicants).admissionRate;
      return majorRate > currentRate ? major : current;
    },
    undefined,
  );

  return {
    points,
    mostDemanded: majors[0],
    highestAdmission,
  };
}
