import { Link } from 'react-router-dom'

export type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-textSecondary">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {item.href && !isLast ? (
                <Link className="hover:text-primaryDark" to={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-textPrimary' : undefined}>{item.label}</span>
              )}
              {!isLast ? <span className="text-textSecondary/60">/</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
