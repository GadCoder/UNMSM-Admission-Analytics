export function formatNumber(value: number | string | null, digits = 0): string {
  return value === null
    ? "—"
    : Number(value).toLocaleString("es-PE", { maximumFractionDigits: digits });
}

export function formatSignedDifference(value: number, digits = 0, suffix = ""): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatNumber(Math.abs(value), digits)}${suffix}`;
}
