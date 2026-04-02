import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

import { cn } from '../foundation/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
  }
>

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primaryDark border border-primary',
  secondary: 'bg-white text-primaryDark border border-primary/30 hover:border-primary/60',
  ghost: 'bg-transparent text-textSecondary border border-transparent hover:bg-primary/5 hover:text-primaryDark',
}

export function Button({ variant = 'secondary', className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-card px-4 py-2 text-sm font-medium shadow-soft transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClassMap[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
