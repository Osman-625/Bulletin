export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="dashboard-skeleton rounded-[1.4rem] p-8 lg:col-span-8">
          <div className="h-3 w-32 rounded-full bg-[var(--color-surface-high)]" />
          <div className="mt-8 h-12 w-3/4 rounded-2xl bg-[var(--color-surface-high)]" />
          <div className="mt-4 h-4 w-2/3 rounded-full bg-[var(--color-surface-elevated)]" />
        </div>
        <div className="dashboard-skeleton rounded-[1.4rem] p-6 lg:col-span-4">
          <div className="h-12 w-12 rounded-full bg-[var(--color-surface-high)]" />
          <div className="mt-8 h-5 w-40 rounded-full bg-[var(--color-surface-high)]" />
          <div className="mt-3 h-4 w-full rounded-full bg-[var(--color-surface-elevated)]" />
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="dashboard-skeleton h-28 rounded-[1.2rem] lg:col-span-3"
          />
        ))}
        <div className="dashboard-skeleton h-80 rounded-[1.4rem] lg:col-span-12" />
      </div>
    </div>
  )
}
