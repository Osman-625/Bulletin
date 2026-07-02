export default function DashboardLoading() {
  return (
    <div className="dashboard-page board-page mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-6 lg:px-7 xl:px-8">
      {/* ── Header ── */}
      <header className="board-header" aria-label="Loading publisher board">
        <div className="board-header-mark" aria-hidden="true" />
        <div className="board-header-copy min-w-0">
          <p className="board-kicker dashboard-skeleton block h-3 w-32 rounded-sm" />
          <h1
            aria-hidden="true"
            className="board-title dashboard-skeleton block h-[1em] w-56 rounded-lg"
          />
          <p className="board-description dashboard-skeleton block h-[1em] w-72 rounded-sm" />
        </div>
        <span
          className="board-header-action pub-btn-primary dashboard-skeleton pointer-events-none self-center"
          aria-hidden="true"
        />
      </header>

      {/* ── Metrics ── */}
      <section className="board-metrics" aria-label="Loading metrics">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="board-metric-card" aria-hidden="true">
            <span className="board-metric-icon dashboard-skeleton" />
            <span className="board-metric-value dashboard-skeleton block h-[0.92em] w-12 rounded-md" />
            <span className="board-metric-label dashboard-skeleton block h-[1em] w-20 rounded-sm" />
            <span className="board-metric-caption dashboard-skeleton block h-[1em] w-24 rounded-sm" />
          </div>
        ))}
      </section>

      {/* ── Board ── */}
      <div className="board-board">
        {/* Panel 1 — Your announcements */}
        <section className="board-panel">
          <div className="board-panel-head">
            <h2
              aria-hidden="true"
              className="dashboard-skeleton block h-[1.12rem] w-44 rounded-md"
            />
            <span
              className="board-panel-link dashboard-skeleton pointer-events-none w-16"
              aria-hidden="true"
            />
          </div>
          <div className="board-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="board-row board-row-static" aria-hidden="true">
                <span className="board-row-index dashboard-skeleton block h-[1em] w-4 rounded-sm" />
                <span className="board-row-main">
                  <span className="board-row-title dashboard-skeleton block h-[1em] w-3/5 rounded-sm" />
                  <span className="board-row-meta dashboard-skeleton block h-[1em] w-2/5 rounded-sm" />
                </span>
                <span className="board-status tone-draft dashboard-skeleton min-w-[4.5rem]" />
                <span className="board-row-stat dashboard-skeleton block h-[1em] w-7 rounded-sm" />
                <span className="board-row-arrow" aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>

        {/* Panel 2 — Needs attention */}
        <section className="board-panel">
          <div className="board-panel-head">
            <h2
              aria-hidden="true"
              className="dashboard-skeleton block h-[1.12rem] w-36 rounded-md"
            />
          </div>
          <div className="board-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="board-row board-row-static" aria-hidden="true">
                <span className="board-row-index dashboard-skeleton block h-[1em] w-4 rounded-sm" />
                <span className="board-row-main">
                  <span className="board-row-title dashboard-skeleton block h-[1em] w-4/5 rounded-sm" />
                  <span className="board-row-meta dashboard-skeleton block h-[1em] w-1/3 rounded-sm" />
                </span>
                <span className="board-status tone-draft dashboard-skeleton min-w-[3.5rem]" />
                <span className="board-row-arrow" aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
