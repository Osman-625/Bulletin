// Skeleton matches the actual feed layout:
// hero + stats bar + filter pills + featured card + 2-col grid

function Bone({
  className = '',
  style = {},
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return <div className={`skeleton-shimmer rounded ${className}`} style={style} />
}

function FeaturedSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl lg:flex-row"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        minHeight: 220,
      }}
    >
      {/* Content side */}
      <div className="flex flex-1 flex-col gap-4 p-7 pl-8">
        <Bone className="h-5 w-24 rounded-full" />
        <div className="flex flex-col gap-2">
          <Bone className="h-6 w-full" />
          <Bone className="h-6 w-3/4" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
        </div>
        <div
          className="flex items-center justify-between border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
      {/* Visual side */}
      <div
        className="min-h-[160px] lg:w-[42%]"
        style={{ background: 'var(--color-surface-elevated)' }}
      />
    </div>
  )
}

function CardSkeleton() {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex flex-1 flex-col gap-3 p-5 pl-6">
        <Bone className="h-5 w-20 rounded-full" />
        <div className="flex flex-col gap-2">
          <Bone className="h-[17px] w-full" />
          <Bone className="h-[17px] w-4/5" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Bone className="h-[13px] w-full" />
          <Bone className="h-[13px] w-5/6" />
        </div>
        <div
          className="flex items-center justify-between border-t pt-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export default function PublicLoading() {
  return (
    <div style={{ minHeight: '100dvh' }}>
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">

        {/* Hero skeleton */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="h-6 w-1.5 rounded-full"
              style={{ background: 'var(--color-border)' }}
            />
            <Bone className="h-3 w-52" />
          </div>
          <Bone className="mb-2 h-16 w-72 rounded-lg" />
          <Bone className="h-4 w-64" />
        </div>

        {/* Stats bar skeleton */}
        <div
          className="mb-8 flex flex-wrap items-center gap-5 rounded-xl border px-5 py-3"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <Bone className="h-4 w-16" />
          <Bone className="h-4 w-20" />
          <Bone className="h-4 w-28" />
        </div>

        {/* Filter skeleton */}
        <div className="mb-8 flex gap-2">
          {[40, 72, 64, 80, 56].map((w, i) => (
            <Bone key={i} className="h-[30px] rounded-full" style={{ width: w }} />
          ))}
        </div>

        {/* Feed skeleton */}
        <div className="flex flex-col gap-4">
          <FeaturedSkeleton />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
