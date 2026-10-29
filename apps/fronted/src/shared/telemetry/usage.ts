/** Explicit, bounded usage events. Never pass URLs, query text, or user data. */
export type UsagePage = "processes" | "careers" | "career_detail" | "comparison" | "not_found";
const fields = {
  page_viewed: [
    "page",
    "path",
    "major_id",
    "query_process",
    "query_modality",
    "query_majors",
    "query_compare",
    "query_academic_area",
    "query_faculty",
    "query_view",
    "query_metric",
  ],
  career_viewed: ["major_id", "process_id", "modality"],
  comparison_updated: ["major_ids", "process_id", "modality"],
  filter_changed: ["page", "filter", "value"],
  search_completed: ["page", "result_count"],
  results_empty: ["page"],
} as const;
export type UsageEvent = keyof typeof fields;
type Attributes = Record<string, string>;
let pending = 0;
let sessionId: string | undefined;
let client: Promise<typeof import("./web")> | undefined;

export function telemetryEnabled() {
  return Boolean(import.meta.env.VITE_FARO_URL) && navigator.doNotTrack !== "1";
}

export function trackUsage(name: UsageEvent, attributes: Attributes) {
  if (!telemetryEnabled() || pending >= 50) return;
  const allowed = fields[name];
  if (!allowed) return;
  const safe: Attributes = {};
  for (const field of allowed) {
    const value = attributes[field];
    if (typeof value === "string" && value.length <= 128) safe[field] = value;
  }
  // An ephemeral identity correlates events only within this document lifetime.
  sessionId ??= crypto.randomUUID();
  safe.visit_session_id = sessionId;
  pending++;
  // The SDK is a separate chunk, loaded only after the first explicit event.
  client ??= import("./web");
  void client
    .then(({ sendUsage }) => sendUsage(name, safe))
    .catch(() => {
      // Observability must never break navigation or produce an unhandled rejection.
    })
    .finally(() => {
      pending--;
    });
}
