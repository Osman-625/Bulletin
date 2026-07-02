const READINESS_ITEMS = [
  'Title and body explain what students need to know.',
  'Date, venue, contact, and registration details are current.',
  'Banner image and urgency level still make sense on mobile.',
] as const

export function PublishingReadinessChecklist() {
  return (
    <section className="announcement-section-card p-5 sm:p-6">
      <p className="future-kicker">Publishing readiness</p>
      <h2 className="font-display mt-3 text-2xl leading-tight font-extrabold text-[var(--color-text-primary)]">
        Check before sending
      </h2>
      <div className="announcement-readiness-list mt-5">
        {READINESS_ITEMS.map((item, index) => (
          <div key={item} className="announcement-readiness-item">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--color-accent-surface)] font-mono text-xs font-bold text-[var(--color-accent)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
