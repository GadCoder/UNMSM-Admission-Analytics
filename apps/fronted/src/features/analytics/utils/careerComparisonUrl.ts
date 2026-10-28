export const MAX_COMPARISON_CAREERS = 4;

export type CareerComparisonUrlState = {
  careerIds: number[];
  malformedCareerIds: string[];
  tooManyCareers: boolean;
  metric: string;
  invalidMetric: boolean;
};

export function parseCareerComparisonUrl(search: string): CareerComparisonUrlState {
  const params = new URLSearchParams(search);
  const raw = params.get("careers");
  const careerIds: number[] = [];
  const malformedCareerIds: string[] = [];
  if (raw !== null && raw !== "") {
    const seen = new Set<number>();
    for (const token of raw.split(",")) {
      if (!/^\d+$/.test(token) || Number(token) <= 0 || !Number.isSafeInteger(Number(token))) {
        malformedCareerIds.push(token);
        continue;
      }
      const id = Number(token);
      if (!seen.has(id)) {
        seen.add(id);
        careerIds.push(id);
      }
    }
  }
  const allowedMetrics = new Set([
    "admission_rate",
    "total_results",
    "admitted_count",
    "applicants_per_admitted",
    "minimum_admitted_score",
    "average_score",
    "highest_score",
  ]);
  const metric = params.get("metric") ?? "admission_rate";
  return {
    careerIds,
    malformedCareerIds,
    tooManyCareers: careerIds.length > MAX_COMPARISON_CAREERS,
    metric: allowedMetrics.has(metric) ? metric : "admission_rate",
    invalidMetric: !allowedMetrics.has(metric),
  };
}

export function buildCareerComparisonHref(state: {
  careerIds: number[];
  processId?: string;
  modalityId?: string;
  metric?: string;
}) {
  const params = new URLSearchParams();
  if (state.careerIds.length) params.set("careers", state.careerIds.join(","));
  if (state.processId) params.set("process", state.processId);
  if (state.modalityId) params.set("modality", state.modalityId);
  if (state.metric && state.metric !== "admission_rate") params.set("metric", state.metric);
  return `/comparar-carreras${params.size ? `?${params.toString()}` : ""}`;
}
