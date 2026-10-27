export type CareerNavigationContext = {
  modalityId?: string;
  discovery?: {
    academicArea?: string;
    faculty?: string;
    query?: string;
    showAll?: boolean;
  };
  processReturnTo?: string;
  comparisonReturnTo?: string;
};

export function isValidComparisonReturnTo(value: string | null | undefined): value is string {
  if (!value || !value.startsWith("/comparar-carreras") || value.startsWith("//") || value.includes("#")) return false;
  try {
    const parsed = new URL(value, "https://internal.invalid");
    if (parsed.origin !== "https://internal.invalid" || parsed.pathname !== "/comparar-carreras") return false;
    const careers = parsed.searchParams.get("careers") ?? "";
    const ids = careers ? careers.split(",") : [];
    return ids.length <= 4 && ids.every((id) => /^\d+$/.test(id) && Number(id) > 0 && Number.isSafeInteger(Number(id)))
      && new Set(ids).size === ids.length
      && ["process", "modality"].every((key) => !parsed.searchParams.has(key) || /^\d+$/.test(parsed.searchParams.get(key)!));
  } catch { return false; }
}

export function careerDetailHref(majorId: number, processId: number, context: CareerNavigationContext = {}): string {
  const params = new URLSearchParams({ process: String(processId) });
  if (context.processReturnTo?.startsWith("/?")) params.set("returnTo", context.processReturnTo);
  if (isValidComparisonReturnTo(context.comparisonReturnTo)) params.set("returnTo", context.comparisonReturnTo);
  if (context.modalityId) params.set("modality", context.modalityId);
  const discovery = context.discovery;
  if (discovery?.academicArea) params.set("academic_area", discovery.academicArea);
  if (discovery?.faculty) params.set("faculty", discovery.faculty);
  if (discovery?.query) params.set("q", discovery.query);
  if (discovery?.showAll) params.set("view", "all");
  return `/carreras/${majorId}?${params}`;
}
