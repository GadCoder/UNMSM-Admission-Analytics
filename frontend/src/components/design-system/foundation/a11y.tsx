import type { PropsWithChildren } from 'react'

export function VisuallyHidden({ children }: PropsWithChildren) {
  return <span className="sr-only">{children}</span>
}
