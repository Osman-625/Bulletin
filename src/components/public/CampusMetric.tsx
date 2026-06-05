export function CampusMetric({
  value,
  label,
  wide = false,
}: {
  value: number | string
  label: string
  wide?: boolean
}) {
  return (
    <div
      className={
        wide
          ? 'public-board-metric rounded-[1rem] border p-4 sm:col-span-1'
          : 'public-board-metric rounded-[1rem] border p-4'
      }
    >
      <p
        className={
          wide
            ? 'font-mono text-sm leading-5 font-bold text-[var(--color-text-primary)] sm:text-base'
            : 'font-mono text-3xl leading-none font-bold text-[var(--color-text-primary)]'
        }
      >
        {value}
      </p>
      <p className="mt-2 font-mono text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
        {label}
      </p>
    </div>
  )
}
