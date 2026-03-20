export function debounce<TArgs extends unknown[]>(callback: (...args: TArgs) => void, delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      callback(...args)
    }, delayMs)
  }
}

export function getVisibleRange({
  scrollTop,
  itemHeight,
  viewportHeight,
  total,
  overscan,
}: {
  scrollTop: number
  itemHeight: number
  viewportHeight: number
  total: number
  overscan: number
}) {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const end = Math.min(total, Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan)
  return { start, end }
}
