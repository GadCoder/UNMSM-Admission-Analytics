type InlineAnnotationProps = {
  label: string
}

export function InlineAnnotation({ label }: InlineAnnotationProps) {
  return <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primaryDark">{label}</span>
}
