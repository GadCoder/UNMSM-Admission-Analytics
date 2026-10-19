export const DEFAULT_ADMISSION_MODALITY = "EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)";

export function resolveAdmissionModality(value: string | null | undefined): string {
  return value?.trim() || DEFAULT_ADMISSION_MODALITY;
}
