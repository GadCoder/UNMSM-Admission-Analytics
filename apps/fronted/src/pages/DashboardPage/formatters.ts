export function formatNumber(value: number | string | null, digits = 0): string {
  return value === null
    ? "—"
    : Number(value).toLocaleString("es-PE", { maximumFractionDigits: digits });
}
