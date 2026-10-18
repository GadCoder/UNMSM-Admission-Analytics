export const DASHBOARD_VIEW_STORAGE_KEY = "unmsm-dashboard-view";

export type DashboardFilters = { academicArea: string; faculty: string; modality: string };
export type DashboardView = { filters: DashboardFilters };

export const emptyDashboardView: DashboardView = {
  filters: { academicArea: "", faculty: "", modality: "" },
};

export function readDashboardView(): DashboardView {
  try {
    const saved = window.sessionStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY);
    if (!saved) return emptyDashboardView;
    const parsed = JSON.parse(saved) as Partial<DashboardView>;
    return {
      filters: { ...emptyDashboardView.filters, ...(parsed.filters ?? {}) },
    };
  } catch {
    return emptyDashboardView;
  }
}

export function saveDashboardView(view: DashboardView) {
  try {
    window.sessionStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, JSON.stringify(view));
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}
