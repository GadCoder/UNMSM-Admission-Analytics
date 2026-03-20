type StarRatingProps = {
  value: number
  max?: number
}

export function StarRating({ value, max = 5 }: StarRatingProps) {
  return (
    <span className="inline-flex items-center gap-1 text-warning" aria-label={`Rating ${value} out of ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} aria-hidden="true" className={index < value ? 'opacity-100' : 'opacity-30'}>
          ★
        </span>
      ))}
    </span>
  )
}
