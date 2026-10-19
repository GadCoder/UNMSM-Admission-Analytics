export const DEFAULT_ADMISSION_MODALITY = "EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)";

export function resolveAdmissionModality(value: string | null | undefined): string {
  return value?.trim() || DEFAULT_ADMISSION_MODALITY;
}

export function formatAdmissionModalityLabel(value: string): string {
  if (value === DEFAULT_ADMISSION_MODALITY) return "Educación Básica Regular (EBR) y Alternativa (EBA)";
  const sentence = value.charAt(0).toLocaleUpperCase("es-PE") + value.slice(1).toLocaleLowerCase("es-PE");
  return sentence.replace(/\b(ebr|eba|unmsm|cepre)\b/gi, (acronym) => acronym.toUpperCase());
}
