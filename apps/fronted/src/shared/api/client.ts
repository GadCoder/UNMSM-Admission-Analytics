import { startApiSpan } from "../telemetry/apiTracing";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  const span = startApiSpan(url, init?.method ?? "GET");
  let status: number | undefined;
  let failed = true;
  try {
    const headers = new Headers(init?.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (span) headers.set("traceparent", span.traceparent);
    const response = await fetch(url, { ...init, headers });
    status = response.status;
    if (!response.ok)
      throw new ApiError(`The API responded with ${response.status}`, response.status);
    const data = (await response.json()) as T;
    failed = false;
    return data;
  } finally {
    try {
      span?.finish(status, failed);
    } catch {
      // Telemetry errors must not replace a successful response or API error.
    }
  }
}
