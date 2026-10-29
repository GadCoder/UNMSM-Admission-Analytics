/** Only bounded, public analytics parameters may enter telemetry. */
export function navigationAttributes(pathname: string, search: string): Record<string, string> {
  const safe: Record<string, string> = {};
  if (/^\/(?:results|majors|compare-majors)?\/?$/.test(pathname)) safe.path = pathname;
  const major = pathname.match(/^\/majors\/(\d+)\/?$/);
  if (major) {
    safe.path = "/majors/:id";
    safe.major_id = major[1];
  }
  const params = new URLSearchParams(search);
  const rules: Record<string, RegExp> = {
    process: /^\d{1,10}$/,
    modality: /^\d{1,10}$/,
    majors: /^\d{1,10}(?:,\d{1,10}){0,3}$/,
    compare: /^\d{1,10}(?:,\d{1,10}){0,3}$/,
    academic_area: /^[A-E]$/,
    faculty: /^F\d{1,3}$/,
    view: /^all$/,
    metric:
      /^(admission_rate|total_results|admitted_count|applicants_per_admitted|minimum_admitted_score|average_score|highest_score)$/,
  };
  for (const [key, rule] of Object.entries(rules)) {
    const value = params.get(key);
    if (value !== null && rule.test(value)) safe[`query_${key}`] = value;
  }
  return safe;
}
