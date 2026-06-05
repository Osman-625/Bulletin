export default function DashboardLoading() {
  return (
    <div className="dashboard-page mx-auto w-full max-w-[88rem] px-4 pt-8 pb-4 sm:px-6 lg:px-8 xl:px-12">
      {/* ── Masthead ── */}
      <header aria-label="Loading publisher desk">
        <div className="pub-mast-top">
          <div className="dashboard-skeleton h-3 w-56 rounded-full" />
          <div className="pub-mast-tools">
            <div className="dashboard-skeleton h-[42px] w-72 rounded-[var(--radius-control)]" />
            <div className="dashboard-skeleton h-[42px] w-36 rounded-[var(--radius-control)]" />
            <div className="dashboard-skeleton h-[42px] w-44 rounded-[var(--radius-control)]" />
          </div>
        </div>

        <div className="dashboard-skeleton mt-7 h-11 w-11/12 rounded-2xl sm:w-3/4" />

        <hr className="dashboard-rule-double pub-rule-spaced" />

        {/* Ledger strip */}
        <div className="pub-ledger">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="pub-ledger-cell">
              <div className="dashboard-skeleton h-2.5 w-24 rounded-full" />
              <div className="dashboard-skeleton mt-1 h-8 w-16 rounded-lg" />
              <div className="dashboard-skeleton h-3 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </header>

      {/* ── Lead grid ── */}
      <div className="pub-lead-grid">
        {/* Needs attention */}
        <section>
          <div className="pub-sec-head">
            <div className="dashboard-skeleton h-2.5 w-44 rounded-full" />
            <div className="dashboard-skeleton h-2.5 w-16 rounded-full" />
          </div>
          <article className="pub-lead-card">
            <div className="pub-lead-hero">
              <div>
                <div className="dashboard-skeleton h-5 w-40 rounded-[var(--radius-tag)]" />
                <div className="dashboard-skeleton mt-4 h-6 w-10/12 rounded-lg" />
                <div className="dashboard-skeleton mt-3 h-3.5 w-full rounded-full" />
                <div className="dashboard-skeleton mt-2 h-3.5 w-4/5 rounded-full" />
                <div className="mt-5 flex gap-2.5">
                  <div className="dashboard-skeleton h-[38px] w-40 rounded-[var(--radius-control)]" />
                  <div className="dashboard-skeleton h-[38px] w-32 rounded-[var(--radius-control)]" />
                </div>
              </div>
              <div className="pub-poster-mat empty" aria-hidden="true" />
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="pub-attn">
                <span className="dashboard-skeleton size-[30px] rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="dashboard-skeleton h-3.5 w-2/3 rounded-full" />
                  <div className="dashboard-skeleton mt-2 h-2.5 w-2/5 rounded-full" />
                </div>
                <div className="dashboard-skeleton h-2.5 w-12 rounded-full" />
              </div>
            ))}
          </article>
        </section>

        {/* On the wire */}
        <section>
          <div className="pub-sec-head">
            <div className="dashboard-skeleton h-2.5 w-28 rounded-full" />
          </div>
          <div className="pub-wire">
            <div className="pub-wire-head">
              <div className="dashboard-skeleton h-4 w-40 rounded-lg" />
              <div className="dashboard-skeleton h-2.5 w-12 rounded-full" />
            </div>
            <div className="pub-timeline">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="pub-tl-item">
                  <span className="pub-tl-node" aria-hidden="true" />
                  <div className="dashboard-skeleton h-2.5 w-20 rounded-full" />
                  <div className="dashboard-skeleton mt-2 h-3.5 w-4/5 rounded-full" />
                  <div className="dashboard-skeleton mt-2 h-2.5 w-2/3 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Contents index ── */}
      <section className="pub-index">
        <div className="pub-index-head">
          <div className="dashboard-skeleton h-5 w-48 rounded-lg" />
          <div className="dashboard-skeleton h-9 w-72 rounded-[var(--radius-control)]" />
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="pub-entry" aria-hidden="true">
              <div className="dashboard-skeleton h-3.5 w-6 rounded-full" />
              <div className="pub-entry-main">
                <div className="dashboard-skeleton h-4 w-3/5 rounded-full" />
                <div className="dashboard-skeleton mt-2 h-2.5 w-2/5 rounded-full" />
              </div>
              <div className="dashboard-skeleton h-5 w-20 rounded-[var(--radius-tag)]" />
              <div className="dashboard-skeleton h-4 w-12 rounded-full" />
              <span />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
