type TrendBadgeProps = {
  text: string
  className?: string
}

export default function TrendBadge({
  text,
  className = '',
}: TrendBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${className}`}
    >
      {text}
    </span>
  )
}
