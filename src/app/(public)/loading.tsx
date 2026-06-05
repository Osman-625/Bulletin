import type { CSSProperties } from 'react'

const EMPTY_BONE_STYLE: CSSProperties = {}

function Bone({
  className = '',
  style = EMPTY_BONE_STYLE,
}: {
  className?: string
  style?: CSSProperties
}) {
  return <div className={`skeleton-shimmer rounded ${className}`} style={style} />
}

function LoadingCard({ poster = false }: { poster?: boolean }) {
  return (
    <div className="future-bento-cell overflow-hidden rounded-[1.25rem]">
      {poster && <div className="h-44 bg-[var(--color-surface-elevated)] sm:h-60" />}
      <div className="flex flex-col gap-4 p-5">
        <div className="flex gap-2">
          <Bone className="h-8 w-24 rounded-md" />
          <Bone className="h-8 w-20 rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-full rounded-md" />
          <Bone className="h-7 w-4/5 rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

function LoadingCardCompact() {
  return (
    <div className="future-bento-cell overflow-hidden rounded-[1.25rem]">
      <div className="flex flex-col gap-3 p-5">
        <Bone className="h-6 w-20 rounded-md" />
        <div className="flex flex-col gap-2">
          <Bone className="h-5 w-full rounded-md" />
          <Bone className="h-5 w-3/4 rounded-md" />
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export default function PublicLoading() {
  return (
    <div className="public-board-canvas min-h-[100dvh]">
      <main className="w-full px-3 py-4 sm:p-5 lg:px-8 lg:py-7">
        <div className="mx-auto flex w-full max-w-[1461px] flex-col gap-4 md:gap-5 xl:gap-6">
          {/* Section 1 — Hero */}
          <section
            className="grid gap-4 md:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.75fr)] lg:grid-cols-12 lg:gap-5"
            aria-label="Loading public bulletin"
          >
            <div className="future-bento-cell rounded-[1.25rem] p-6 sm:p-8 md:p-9 lg:col-span-8 lg:min-h-[28rem] lg:p-10 xl:min-h-[31rem]">
              <div className="flex max-w-[46rem] flex-col gap-3">
                <Bone className="h-4 w-48 rounded-md" />
                <Bone className="mt-6 h-16 w-full max-w-[34rem] rounded-xl sm:h-20 lg:h-24" />
                <Bone className="h-16 w-5/6 max-w-[30rem] rounded-xl sm:h-20 lg:h-24" />
                <Bone className="mt-2 h-5 w-3/4 rounded-md" />
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Bone className="h-24 rounded-[1.15rem]" />
                <Bone className="h-24 rounded-[1.15rem]" />
                <Bone className="h-24 rounded-[1.15rem]" />
              </div>
            </div>

            <aside className="future-bento-cell rounded-[1.25rem] p-6 sm:p-8 lg:col-span-4">
              <Bone className="mb-6 h-5 w-36 rounded-md" />
              <div className="grid grid-cols-2 gap-3">
                <Bone className="h-20 rounded-[1rem]" />
                <Bone className="h-20 rounded-[1rem]" />
              </div>
              <Bone className="mt-4 h-20 w-full rounded-[1rem]" />
              <Bone className="mt-4 h-12 w-full rounded-full" />
            </aside>
          </section>

          {/* Section 2 — Search + filter */}
          <section className="grid gap-2 md:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="future-bento-cell rounded-[1.05rem] p-2.5 sm:p-3">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Bone className="h-12 rounded-[1rem]" />
                <Bone className="h-12 w-full rounded-[1rem] sm:w-28" />
              </div>
            </div>
            <div className="future-bento-cell rounded-[1.05rem] p-2.5 sm:p-3">
              <div className="flex flex-wrap gap-2">
                {[64, 104, 92, 112, 88].map((width) => (
                  <Bone key={width} className="h-11 rounded-[0.9rem]" style={{ width }} />
                ))}
              </div>
            </div>
          </section>

          {/* Section 3 — Featured + board panel */}
          <section className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Bone className="mb-2 h-3 w-36" />
              <LoadingCard poster />
            </div>
            <div className="hidden flex-col gap-3 xl:flex">
              <Bone className="h-3 w-44" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="future-bento-cell rounded-[1.25rem] p-4">
                  <Bone className="mb-2 h-5 w-20 rounded-md" />
                  <Bone className="h-4 w-full" />
                  <Bone className="mt-1 h-4 w-5/6" />
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 — Feed (uniform 3-column grid; cards self-size, top-aligned) */}
          <section>
            <div className="mb-4 flex items-center gap-4">
              <Bone className="h-3 w-32" />
              <Bone className="h-3 w-48" />
            </div>
            <div className="grid items-start gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
              <LoadingCard poster />
              <LoadingCardCompact />
              <LoadingCard poster />
              <LoadingCardCompact />
              <LoadingCard poster />
              <LoadingCardCompact />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
