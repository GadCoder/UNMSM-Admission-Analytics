import type { PropsWithChildren } from 'react'

import { cn } from '../foundation/cn'

type GridProps = PropsWithChildren<{
  className?: string
}>

type GridItemProps = PropsWithChildren<{
  className?: string
  span?: number
}>

export function Grid({ className, children }: GridProps) {
  return <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-12', className)}>{children}</div>
}

const spanClassMap: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
}

export function GridItem({ className, span = 12, children }: GridItemProps) {
  return <div className={cn('md:col-span-12', spanClassMap[span] ?? 'md:col-span-12', className)}>{children}</div>
}
