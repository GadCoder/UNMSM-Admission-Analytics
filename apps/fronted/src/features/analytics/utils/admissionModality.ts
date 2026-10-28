import type { Modality } from "../api/analytics.types";

export const DEFAULT_ADMISSION_MODALITY =
  "EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)";

export function modalityNameFromParam(
  value: string | null | undefined,
  modalities: Modality[] = [],
): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  const byId = modalities.find((item) => String(item.id) === raw);
  return byId?.name;
}

export function modalityUrlValue(name: string, modalities: Modality[] = []): string | undefined {
  if (/^\d+$/.test(name)) return name;
  const id = modalities.find((item) => item.name === name)?.id;
  return id === undefined ? undefined : String(id);
}

export function resolveAdmissionModality(value: string | null | undefined): string {
  return value?.trim() || DEFAULT_ADMISSION_MODALITY;
}

export function formatAdmissionModalityLabel(value: string): string {
  if (value === DEFAULT_ADMISSION_MODALITY)
    return "Educación Básica Regular (EBR) y Alternativa (EBA)";
  const sentence =
    value.charAt(0).toLocaleUpperCase("es-PE") + value.slice(1).toLocaleLowerCase("es-PE");
  return sentence.replace(/\b(ebr|eba|unmsm|cepre)\b/gi, (acronym) => acronym.toUpperCase());
}

export function compactAdmissionModalityLabel(value: string): string {
  const fullLabel = formatAdmissionModalityLabel(value);
  return /\bEBR\b/i.test(fullLabel) && /\bEBA\b/i.test(fullLabel) ? "EBR y EBA" : fullLabel;
}
