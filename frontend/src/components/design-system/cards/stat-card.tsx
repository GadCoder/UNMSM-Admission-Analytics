import type { ReactNode } from 'react'

import { cn } from '../foundation/cn'

type StatCardVariant = 'default' | 'compact' | 'with-icon' | 'with-helper'

type StatCardProps = {
  label: string
  value: string
  trend?: ReactNode
  helperText?: string
  icon?: ReactNode
  variant?: StatCardVariant
}

export function StatCard({ label, value, trend, helperText, icon, variant = 'default' }: StatCardProps) {
  return (
    <article className={cn('rounded-card border border-primary/10 bg-surface p-4 shadow-soft', variant === 'compact' && 'p-3')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.12em] text-textSecondary">{label}</p>
        {variant === 'with-icon' && icon ? <span className="text-primaryDark">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold text-textPrimary">{value}</p>
      {trend ? <div className="mt-2">{trend}</div> : null}
      {(variant === 'with-helper' || helperText) && helperText ? <p className="mt-2 text-xs text-textSecondary">{helperText}</p> : null}
    </article>
  )
}
