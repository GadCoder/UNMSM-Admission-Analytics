import type { AdmissionProcess } from "../api/analytics.types";

export function formatProcessLabel(process: AdmissionProcess) {
  const sequence = process.sequence.includes("-")
    ? process.sequence.slice(process.sequence.lastIndexOf("-") + 1)
    : process.sequence;
  return `${process.year}-${sequence}`;
}
