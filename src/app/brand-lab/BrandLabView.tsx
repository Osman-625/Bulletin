import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { BrandDirection, BrandDirectionSlug } from '@/lib/brand-lab/directions'
import styles from './brand-lab.module.css'

type BrandLabViewProps = {
  directions: BrandDirection[]
  activeSlug: BrandDirectionSlug
  researchAnchors: readonly {
    label: string
    url: string
    note: string
  }[]
}

type BrandLabStyle = CSSProperties & Record<`--${string}`, string>

export function BrandLabView({ directions, activeSlug, researchAnchors }: BrandLabViewProps) {
  const activeDirection = directions.find((direction) => direction.slug === activeSlug) ?? directions[0]

  return (
    <main className={styles.labShell}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Bulletin Brand Lab / INTI-inspired identity system</p>
          <h1>Three visual futures for a campus bulletin that feels official, alive, and its own.</h1>
          <p>
            Built from INTI&apos;s academic information architecture, red authority, campus credibility, and
            announcement-heavy content patterns, then reworked into three original design systems for Bulletin.
          </p>
        </div>

        <aside className={styles.researchPanel} aria-label="Research synthesis">
          <span>Research synthesis</span>
          <ul>
            {researchAnchors.slice(0, 5).map((anchor) => (
              <li key={anchor.label}>
                <a href={anchor.url} target="_blank" rel="noreferrer">
                  {anchor.label}
                </a>
                <small>{anchor.note}</small>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className={styles.comparisonGrid} aria-label="Brand direction comparison">
        {directions.map((direction, index) => (
          <Link
            key={direction.slug}
            href={`/brand-lab?direction=${direction.slug}`}
            className={styles.comparisonCard}
            aria-current={direction.slug === activeDirection.slug ? 'page' : undefined}
            style={directionStyle(direction)}
          >
            <div className={styles.comparisonHeader}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <Image src={direction.assets.markSrc} alt="" width={52} height={52} />
            </div>
            <strong>{direction.name}</strong>
            <p>{direction.tagline}</p>
            <div className={styles.miniPreview} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <small>{direction.status}</small>
          </Link>
        ))}
      </section>

      <section
        className={styles.directionStage}
        data-direction={activeDirection.slug}
        style={directionStyle(activeDirection)}
      >
        <header className={styles.directionHeader}>
          <div>
            <p className={styles.kicker}>{activeDirection.role}</p>
            <h2>{activeDirection.name}</h2>
            <p>{activeDirection.thesis}</p>
          </div>
          <div className={styles.assetSpec}>
            <Image
              src={activeDirection.assets.markSrc}
              alt={`${activeDirection.assets.markName} preview`}
              width={128}
              height={128}
              preload
            />
            <div>
              <span>Original companion mark</span>
              <strong>{activeDirection.assets.markName}</strong>
              <p>{activeDirection.assets.motif}</p>
            </div>
          </div>
        </header>

        <div className={styles.systemStrip}>
          <SystemNote title="Personality" lines={activeDirection.personality} />
          <SystemNote
            title="Typography"
            lines={[
              `${activeDirection.typography.displayName} display`,
              `${activeDirection.typography.bodyName} body`,
              `${activeDirection.typography.labelName} labels`,
            ]}
          />
          <SystemNote
            title="Best fit"
            lines={[activeDirection.bestFor, activeDirection.watchOut]}
          />
        </div>

        <div className={styles.previewGrid}>
          <section className={styles.desktopSpec} aria-label={`${activeDirection.name} desktop mockup`}>
            <PreviewFrame direction={activeDirection} variant="desktop" />
          </section>
          <aside className={styles.mobileSpec} aria-label={`${activeDirection.name} mobile mockup`}>
            <PreviewFrame direction={activeDirection} variant="mobile" />
          </aside>
        </div>

        <section className={styles.dashboardSpec} aria-label={`${activeDirection.name} dashboard concept`}>
          <DashboardConcept direction={activeDirection} />
        </section>

        <section className={styles.specGrid} aria-label={`${activeDirection.name} design system`}>
          <PaletteSpec direction={activeDirection} />
          <MotionSpec direction={activeDirection} />
          <ComponentSpec direction={activeDirection} />
          <AssetLanguage direction={activeDirection} />
        </section>
      </section>
    </main>
  )
}

function directionStyle(direction: BrandDirection): BrandLabStyle {
  return {
    '--lab-canvas': direction.palette.canvas,
    '--lab-surface': direction.palette.surface,
    '--lab-elevated': direction.palette.elevated,
    '--lab-ink': direction.palette.ink,
    '--lab-muted': direction.palette.muted,
    '--lab-accent': direction.palette.accent,
    '--lab-accent-soft': direction.palette.accentSoft,
    '--lab-navy': direction.palette.navy,
    '--lab-gold': direction.palette.gold,
    '--lab-line': direction.palette.line,
    '--lab-dark-canvas': direction.palette.darkCanvas,
    '--lab-dark-surface': direction.palette.darkSurface,
    '--lab-dark-ink': direction.palette.darkInk,
    '--lab-display': direction.typography.display,
    '--lab-body': direction.typography.body,
    '--lab-label': direction.typography.label,
  }
}

function SystemNote({ title, lines }: { title: string; lines: readonly string[] }) {
  return (
    <article className={styles.systemNote}>
      <span>{title}</span>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </article>
  )
}

function PreviewFrame({
  direction,
  variant,
}: {
  direction: BrandDirection
  variant: 'desktop' | 'mobile'
}) {
  const compact = variant === 'mobile'

  return (
    <div className={compact ? styles.phoneFrame : styles.browserFrame}>
      <div className={styles.previewSurface} data-direction={direction.slug}>
        <header className={styles.previewMasthead}>
          <div className={styles.previewBrand}>
            <Image src={direction.assets.markSrc} alt="" width={compact ? 30 : 38} height={compact ? 30 : 38} />
            <div>
              <strong>Bulletin</strong>
              <span>{direction.sample.issue}</span>
            </div>
          </div>
          <div className={styles.previewTicker}>{direction.sample.ticker}</div>
        </header>

        <section className={styles.previewHero}>
          <div className={styles.previewHeroCopy}>
            <span>{direction.status}</span>
            <h3>{direction.sample.heroTitle}</h3>
            <p>{direction.sample.heroBody}</p>
          </div>
          <div className={styles.posterPane}>
            <Image
              src={direction.sample.posterSrc}
              alt=""
              fill
              sizes={compact ? '220px' : '340px'}
              loading="eager"
              className={styles.posterImage}
            />
          </div>
        </section>

        <section className={styles.noticeGrid}>
          <article className={styles.leadNotice}>
            <div className={styles.noticeMeta}>
              <span>{direction.sample.categoryOne}</span>
              <span>Registration open</span>
            </div>
            <h4>{direction.sample.leadTitle}</h4>
            <p>{direction.sample.detailDeck}</p>
            <footer>{direction.sample.leadMeta}</footer>
          </article>
          <article className={styles.secondaryNotice}>
            <div className={styles.noticeMeta}>
              <span>{direction.sample.categoryTwo}</span>
              <span>Today</span>
            </div>
            <h4>{direction.sample.secondaryTitle}</h4>
            <p>{direction.sample.heroBody}</p>
          </article>
        </section>

        <article className={styles.detailNotice}>
          <div>
            <span>Announcement detail</span>
            <h4>{direction.sample.detailTitle}</h4>
          </div>
          <p>{direction.sample.detailDeck}</p>
        </article>
      </div>
    </div>
  )
}

function DashboardConcept({ direction }: { direction: BrandDirection }) {
  const rows = ['Submitted for review', 'Scheduled this week', 'Needs poster check']

  return (
    <div className={styles.dashboardSurface}>
      <div className={styles.dashboardIntro}>
        <span>Dashboard concept</span>
        <h3>{direction.sample.dashboardTitle}</h3>
        <p>{direction.layout.dashboard}</p>
      </div>
      <div className={styles.dashboardMetric}>
        <span>{direction.sample.dashboardMetric}</span>
        <p>Review queue and publishing health are visible before charts or decoration.</p>
      </div>
      <div className={styles.dashboardQueue}>
        {rows.map((row, index) => (
          <div key={row}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{row}</strong>
            <small>{index === 0 ? direction.sample.leadTitle : direction.sample.secondaryTitle}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaletteSpec({ direction }: { direction: BrandDirection }) {
  const swatches = [
    ['Canvas', direction.palette.canvas],
    ['Surface', direction.palette.surface],
    ['INTI red evolved', direction.palette.accent],
    ['Navy', direction.palette.navy],
    ['Gold', direction.palette.gold],
    ['Dark canvas', direction.palette.darkCanvas],
  ] as const

  return (
    <article className={styles.specPanel}>
      <span>Color system</span>
      <div className={styles.swatches}>
        {swatches.map(([label, color]) => (
          <div key={label}>
            <i style={{ background: color }} />
            <small>{label}</small>
          </div>
        ))}
      </div>
      <p>
        Red remains the institutional signal. Warm neutrals carry daily reading, navy adds academic depth,
        and gold is reserved for deadlines, issue metadata, and high-value states.
      </p>
    </article>
  )
}

function MotionSpec({ direction }: { direction: BrandDirection }) {
  return (
    <article className={styles.specPanel}>
      <span>Motion system</span>
      <div className={styles.motionTrack} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <h3>{direction.motion.principle}</h3>
      <p>{direction.motion.load}</p>
      <small>{direction.motion.reducedMotion}</small>
    </article>
  )
}

function ComponentSpec({ direction }: { direction: BrandDirection }) {
  const specs = [
    direction.components.navigation,
    direction.components.cards,
    direction.components.filters,
    direction.components.dashboard,
  ]

  return (
    <article className={styles.specPanel}>
      <span>Component language</span>
      <ul className={styles.specList}>
        {specs.map((spec) => (
          <li key={spec}>{spec}</li>
        ))}
      </ul>
    </article>
  )
}

function AssetLanguage({ direction }: { direction: BrandDirection }) {
  return (
    <article className={styles.specPanel}>
      <span>Design assets</span>
      <h3>{direction.assets.pattern}</h3>
      <p>{direction.assets.posterTreatment}</p>
      <div className={styles.darkPreview}>
        <Image src={direction.assets.markSrc} alt="" width={54} height={54} />
        <div>
          <strong>Dark mode ready</strong>
          <small>Uses a separate dark canvas and elevated surface roles.</small>
        </div>
      </div>
    </article>
  )
}
