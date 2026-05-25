export function FilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[40, 72, 64, 80, 56].map((width, index) => (
        <div key={index} className="skeleton-shimmer h-11 rounded-[0.9rem]" style={{ width }} />
      ))}
    </div>
  )
}
