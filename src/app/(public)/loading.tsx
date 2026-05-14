import { BrandMark } from '@/components/layout/BrandMark'

function Bone({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton-shimmer rounded ${className}`} style={style} />
}

function LoadingCard({ poster = false }: { poster?: boolean }) {
  return (
    <div className="future-bento-cell overflow-hidden rounded-[1.35rem]">
      {poster && <div className="h-52 bg-[var(--color-surface-elevated)] sm:h-72" />}
      <div className="flex flex-col gap-4 p-5 sm:p-6">
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
          <Bone className="h-4 w-3/5" />
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

export default function PublicLoading() {
  return (
    <div className="future-warm-plane min-h-[100dvh]">
      <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 sm:gap-5">
          <section className="grid gap-4 lg:grid-cols-12" aria-label="Loading public bulletin">
            <div className="future-bento-cell public-page-reveal rounded-[1.75rem] p-5 sm:p-8 lg:col-span-7 lg:min-h-[31rem] lg:p-10 xl:col-span-8">
              <div className="mb-8 flex items-center gap-4">
                <BrandMark
                  size="lg"
                  showText={false}
                  className="campus-logo-halo rounded-[1.35rem]"
                  preload
                />
                <div>
                  <p className="future-kicker">Loading campus signal</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-text-muted)]">
                    Gathering live notices
                  </p>
                </div>
              </div>

              <div className="loading-signal mb-8 h-2 overflow-hidden rounded-full bg-[var(--color-surface-high)]" />

              <div className="flex max-w-[46rem] flex-col gap-3">
                <Bone className="h-16 w-full max-w-[34rem] rounded-xl sm:h-20 lg:h-28" />
                <Bone className="h-16 w-5/6 max-w-[30rem] rounded-xl sm:h-20 lg:h-28" />
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <Bone className="h-24 rounded-[1.15rem]" />
                <Bone className="h-24 rounded-[1.15rem]" />
                <Bone className="h-24 rounded-[1.15rem]" />
              </div>
            </div>

            <aside className="future-bento-cell public-page-reveal relative overflow-hidden rounded-[1.75rem] p-5 delay-2 sm:p-8 lg:col-span-5 xl:col-span-4">
              <div className="absolute top-6 right-6 h-20 w-20 rounded-full bg-[var(--color-accent-inti)] opacity-85" />
              <div className="relative flex min-h-[22rem] flex-col justify-between">
                <BrandMark
                  size="hero"
                  showText={false}
                  className="campus-logo-halo float-soft w-fit rounded-[1.9rem]"
                  preload
                />
                <div className="flex flex-col gap-3">
                  <Bone className="h-8 w-48 rounded-md" />
                  <Bone className="h-4 w-64 max-w-full" />
                  <Bone className="h-4 w-52 max-w-full" />
                </div>
              </div>
            </aside>
          </section>

          <section className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="future-bento-cell rounded-[1.35rem] p-3 sm:p-4">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Bone className="h-12 rounded-[1rem]" />
                <Bone className="h-12 w-full rounded-[1rem] sm:w-28" />
              </div>
            </div>
            <div className="future-bento-cell rounded-[1.35rem] p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
                {[64, 104, 92, 112, 88].map((width) => (
                  <Bone key={width} className="h-11 rounded-[0.9rem]" style={{ width }} />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7 xl:col-span-8">
              <Bone className="mb-2 h-3 w-36" />
              <LoadingCard poster />
            </div>
            <div className="grid gap-3 lg:col-span-5 xl:col-span-4">
              <Bone className="h-3 w-44" />
              <LoadingCard />
              <LoadingCard />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
