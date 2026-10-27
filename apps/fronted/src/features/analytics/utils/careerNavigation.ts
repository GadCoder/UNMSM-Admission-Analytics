export type CareerNavigationContext = {
  modalityId?: string;
  discovery?: {
    academicArea?: string;
    faculty?: string;
    query?: string;
    showAll?: boolean;
  };
  processReturnTo?: string;
};

export function careerDetailHref(majorId: number, processId: number, context: CareerNavigationContext = {}): string {
  const params = new URLSearchParams({ process: String(processId) });
  if (context.processReturnTo?.startsWith("/?")) params.set("returnTo", context.processReturnTo);
  if (context.modalityId) params.set("modality", context.modalityId);
  const discovery = context.discovery;
  if (discovery?.academicArea) params.set("academic_area", discovery.academicArea);
  if (discovery?.faculty) params.set("faculty", discovery.faculty);
  if (discovery?.query) params.set("q", discovery.query);
  if (discovery?.showAll) params.set("view", "all");
  return `/carreras/${majorId}?${params}`;
}
