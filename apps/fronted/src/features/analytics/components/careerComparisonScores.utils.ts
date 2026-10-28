export type CareerScoreDomain = { min: number; max: number; ticks: number[] };

export function getCareerScoreDomain(values: number[]): CareerScoreDomain {
  const finite = values.filter(Number.isFinite);
  const observedMin = finite.length ? Math.min(...finite) : 0;
  const observedMax = finite.length ? Math.max(...finite) : 1;
  const span = observedMax - observedMin || Math.max(Math.abs(observedMax) * 0.1, 1);
  const rawStep = span / 4;
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / power;
  const step =
    (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 3.5 ? 2.5 : fraction <= 7.5 ? 5 : 10) *
    power;
  const padding = step * 0.04;
  const lower =
    observedMin >= 0
      ? Math.max(0, Math.floor((observedMin - padding) / step) * step)
      : Math.floor((observedMin - padding) / step) * step;
  const upper = Math.ceil((observedMax + padding) / step) * step || step;
  const ticks: number[] = [];
  for (let value = lower; value <= upper + step * 0.01; value += step)
    ticks.push(Number(value.toPrecision(12)));
  return { min: lower, max: upper, ticks };
}
