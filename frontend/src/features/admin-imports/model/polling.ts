const MIN_POLL_MS = 2_000
const MAX_POLL_MS = 5_000
const STEP_POLL_MS = 500

export function nextPollInterval(previousMs: number, hasStatusChanged: boolean) {
  if (hasStatusChanged) {
    return MIN_POLL_MS
  }
  return Math.min(MAX_POLL_MS, Math.max(MIN_POLL_MS, previousMs + STEP_POLL_MS))
}

export function buildProcessOverrides(
  fileNames: string[],
  defaultProcessId: number,
  selectedOverrides: Record<string, number>
) {
  return fileNames.reduce<Record<string, number>>((accumulator, fileName) => {
    const override = selectedOverrides[fileName]
    if (override !== undefined && override !== defaultProcessId) {
      accumulator[fileName] = override
    }
    return accumulator
  }, {})
}
