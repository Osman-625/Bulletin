// Skeleton matches the public feed layout:
// masthead + search/filter row + pinned card + card grid

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
    <div className="min-h-[100dvh]">
      <main className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-14 2xl:px-16">
        <div className="mx-auto flex w-full max-w-[112rem] flex-col gap-8">
          <section className="flex flex-col gap-7 border-b border-[var(--color-border)] pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[46rem]">
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="h-7 w-1.5 rounded-full"
                  style={{ background: 'var(--color-border)' }}
                />
                <Bone className="h-3 w-52" />
              </div>
              <div className="flex flex-col gap-3">
                <Bone className="h-16 w-full max-w-[34rem] rounded-lg sm:h-20 lg:h-32" />
                <Bone className="h-16 w-4/5 max-w-[30rem] rounded-lg sm:h-20 lg:h-32" />
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Bone className="h-4 w-full max-w-[30rem]" />
                <Bone className="h-4 w-4/5 max-w-[24rem]" />
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 lg:max-w-[34rem] lg:items-end">
              <Bone className="h-3 w-36" />
            </div>
          </section>

          <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <Bone className="h-11 min-w-0 flex-1 rounded-[10px]" />
              <Bone className="h-11 w-24 rounded-[10px]" />
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-[46rem]">
              {[40, 72, 64, 80, 56].map((w, i) => (
                <Bone key={i} className="h-[30px] rounded-full" style={{ width: w }} />
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-8">
            <section>
              <Bone className="mb-3 h-3 w-16" />
              <FeaturedSkeleton />
            </section>
            <section>
              <div className="mb-3 border-t border-[var(--color-border)] pt-5">
                <Bone className="h-3 w-44" />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
