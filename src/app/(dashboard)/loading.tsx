export default function DashboardLoading() {
  return (
    <div className="dashboard-page publisher-dashboard-shell mx-auto w-full max-w-[92rem] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="publisher-command-layout">
        <section className="dashboard-command-card publisher-overview-hero rounded-[1.75rem] p-5 sm:p-7 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="dashboard-skeleton h-3 w-36 rounded-full" />
              <div className="dashboard-skeleton mt-8 h-12 w-11/12 rounded-2xl sm:w-3/4" />
              <div className="dashboard-skeleton mt-4 h-4 w-full max-w-[36rem] rounded-full" />
              <div className="dashboard-skeleton mt-3 h-4 w-4/5 max-w-[30rem] rounded-full" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <div className="dashboard-skeleton h-12 w-full rounded-[1rem] sm:w-44" />
              <div className="dashboard-skeleton h-12 w-full rounded-[1rem] sm:w-36" />
            </div>
          </div>
          <div className="publisher-overview-note mt-6 flex flex-col gap-2 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="dashboard-skeleton h-4 w-40 rounded-full" />
            <div className="dashboard-skeleton h-4 w-32 rounded-full" />
          </div>
        </section>

        <section className="publisher-quiet-metrics" aria-label="Loading publisher metrics">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="publisher-metric-item">
              <div className="dashboard-skeleton h-3 w-28 rounded-full" />
              <div className="dashboard-skeleton mt-4 h-9 w-20 rounded-xl" />
              <div className="dashboard-skeleton mt-5 h-4 w-full rounded-full" />
            </div>
          ))}
        </section>

        <section className="publisher-workspace-board">
          <div className="dashboard-command-card rounded-[1.75rem] p-5 sm:p-6">
            <div className="dashboard-skeleton h-3 w-28 rounded-full" />
            <div className="dashboard-skeleton mt-4 h-7 w-52 rounded-xl" />
            <div className="mt-6 grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="dashboard-skeleton h-28 rounded-[1.25rem]" />
              ))}
            </div>
          </div>
          <aside className="dashboard-command-card publisher-next-actions rounded-[1.75rem] p-5 sm:p-6">
            <div className="dashboard-skeleton h-3 w-36 rounded-full" />
            <div className="dashboard-skeleton mt-4 h-8 w-56 rounded-xl" />
            <div className="mt-6 grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="dashboard-skeleton h-14 rounded-[1rem]" />
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
