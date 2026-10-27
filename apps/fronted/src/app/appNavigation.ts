import type { Modality } from "../features/analytics/api/analytics.types";
import { DEFAULT_ADMISSION_MODALITY, modalityNameFromParam, modalityUrlValue } from "../features/analytics/utils/admissionModality";

type AppNavigationOptions = {
  pathname: string;
  search: string;
  modalities?: Modality[];
  savedModality?: string;
};

export function buildAppNavigation({ pathname, search, modalities, savedModality }: AppNavigationOptions) {
  const isCareers = pathname.startsWith("/carreras");
  const params = new URLSearchParams(search);
  const rawModality = params.get("modality");
  const currentModality = rawModality
    ? modalityNameFromParam(rawModality, modalities)
    : isCareers ? DEFAULT_ADMISSION_MODALITY : savedModality;
  const sharedParams = new URLSearchParams();
  const process = params.get("process");
  if (process) sharedParams.set("process", process);
  const modalityId = rawModality && /^\d+$/.test(rawModality)
    ? rawModality
    : currentModality ? modalityUrlValue(currentModality, modalities) : undefined;
  if (modalityId) sharedParams.set("modality", modalityId);
  const processQuery = sharedParams.size ? `?${sharedParams.toString()}` : "";

  const discoveryParams = new URLSearchParams(sharedParams);
  if (isCareers) {
    for (const key of ["academic_area", "faculty", "q", "view", "returnTo"]) {
      const value = params.get(key);
      if (value) discoveryParams.set(key, value);
    }
  }

  return {
    isCareers,
    processHref: `/${processQuery}`,
    discoveryHref: `/carreras${discoveryParams.size ? `?${discoveryParams.toString()}` : ""}`,
  };
}
