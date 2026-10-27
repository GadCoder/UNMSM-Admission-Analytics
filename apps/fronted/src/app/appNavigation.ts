import type { Modality } from "../features/analytics/api/analytics.types";
import {
  DEFAULT_ADMISSION_MODALITY,
  modalityNameFromParam,
  modalityUrlValue,
} from "../features/analytics/utils/admissionModality";

type AppNavigationOptions = {
  pathname: string;
  search: string;
  modalities?: Modality[];
  savedModality?: string;
};

type AppPage = "processes" | "careers" | "comparison";

const pageByPath = (pathname: string): AppPage => {
  if (pathname === "/comparar-carreras") return "comparison";
  if (pathname.startsWith("/carreras")) return "careers";
  return "processes";
};

const pageNavigation = {
  processes: {
    defaultModality: undefined,
    discoveryParams: [],
    comparisonParams: [],
  },
  careers: {
    defaultModality: DEFAULT_ADMISSION_MODALITY,
    discoveryParams: ["academic_area", "faculty", "q", "view", "returnTo"],
    comparisonParams: [],
  },
  comparison: {
    defaultModality: DEFAULT_ADMISSION_MODALITY,
    discoveryParams: [],
    comparisonParams: ["careers", "metric"],
  },
} satisfies Record<
  AppPage,
  {
    defaultModality: string | undefined;
    discoveryParams: string[];
    comparisonParams: string[];
  }
>;

export function buildAppNavigation({
  pathname,
  search,
  modalities,
  savedModality,
}: AppNavigationOptions) {
  const page = pageByPath(pathname);
  const pageRules = pageNavigation[page];
  const params = new URLSearchParams(search);
  const rawModality = params.get("modality");
  const currentModality = rawModality
    ? modalityNameFromParam(rawModality, modalities)
    : (pageRules.defaultModality ?? savedModality);
  const sharedParams = new URLSearchParams();
  const process = params.get("process");
  if (process) sharedParams.set("process", process);
  const modalityId =
    rawModality && /^\d+$/.test(rawModality)
      ? rawModality
      : currentModality
        ? modalityUrlValue(currentModality, modalities)
        : undefined;
  if (modalityId) sharedParams.set("modality", modalityId);
  const processQuery = sharedParams.size ? `?${sharedParams.toString()}` : "";

  const discoveryParams = new URLSearchParams(sharedParams);
  for (const key of pageRules.discoveryParams) {
    const value = params.get(key);
    if (value) discoveryParams.set(key, value);
  }

  const comparisonParams = new URLSearchParams(sharedParams);
  for (const key of pageRules.comparisonParams) {
    const value = params.get(key);
    if (value) comparisonParams.set(key, value);
  }

  return {
    page,
    processHref: `/${processQuery}`,
    discoveryHref: `/carreras${discoveryParams.size ? `?${discoveryParams.toString()}` : ""}`,
    comparisonHref: `/comparar-carreras${comparisonParams.size ? `?${comparisonParams.toString()}` : ""}`,
  };
}
