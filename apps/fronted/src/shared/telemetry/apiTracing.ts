/** Lightweight bridge: API calls never wait for the tracing SDK to download. */
export type ApiSpan = {
  traceparent: string;
  finish: (status?: number, failed?: boolean) => void;
};
type Starter = (url: string, method: string) => ApiSpan | undefined;
let starter: Starter | undefined;
export function registerApiTracer(value: Starter) {
  starter = value;
}
export function startApiSpan(url: string, method: string): ApiSpan | undefined {
  if (navigator.doNotTrack === "1" || import.meta.env.VITE_TRACING_ENABLED !== "true") return;
  try {
    return starter?.(url, method);
  } catch {
    return;
  }
}
