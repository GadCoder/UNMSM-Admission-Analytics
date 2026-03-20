import type { PropsWithChildren } from 'react'

import { cn } from '../foundation/cn'

type ContainerProps = PropsWithChildren<{
  className?: string
}>

export function Container({ className, children }: ContainerProps) {
  return <div className={cn('mx-auto w-full max-w-[1600px] px-4 md:px-8', className)}>{children}</div>
}
