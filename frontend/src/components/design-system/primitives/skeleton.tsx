import { cn } from '../foundation/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-card bg-primary/10', className)} />
}
