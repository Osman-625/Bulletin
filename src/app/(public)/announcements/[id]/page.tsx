import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { getAnnouncementById } from '@/lib/data'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const a = await getAnnouncementById(id)
  if (!a) return {}
  return { title: a.title }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const announcement = await getAnnouncementById(id)
  if (!announcement) notFound()

  const { title, body, banner_url, published_at, expires_at, registration_link, categories, organizations } =
    announcement

  const catColor = categories?.color ?? '#C8102E'

  return (
    <div style={{ minHeight: '100dvh' }}>
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">

        {/* Back link */}
        <Link
          href="/"
          className="animate-fade-up mb-8 inline-flex items-center gap-1.5 rounded text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ← Back to Bulletin
        </Link>

        {/* Banner */}
        {banner_url && (
          <div
            className="animate-fade-up delay-1 relative mb-8 aspect-[16/7] overflow-hidden rounded-xl"
            style={{ background: 'var(--color-surface-elevated)' }}
          >
            <Image
              src={banner_url}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <article className="animate-fade-up delay-2">
          {/* Dateline */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {categories && (
              <span
                className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.06em]"
                style={{
                  color: catColor,
                  background: catColor + '1A',
                }}
              >
                {categories.name}
              </span>
            )}
            {organizations?.name && (
              <span
                className="text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {organizations.name}
              </span>
            )}
            {published_at && (
              <span
                className="text-[12px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {formatDate(published_at)}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="font-display font-bold leading-[1.1] tracking-tight mb-6"
            style={{
              fontSize: 'clamp(1.8rem, 5vw, 3rem)',
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </h1>

          {/* Category-coloured rule */}
          <div className="mb-0.5 h-[3px] rounded-full" style={{ background: catColor }} />
          <div className="mb-8 h-px" style={{ background: 'var(--color-border)' }} />

          {/* Body */}
          <div
            className="prose-bulletin text-[15px] leading-[1.85]"
            style={{ color: 'var(--color-text-secondary)', maxWidth: '65ch' }}
          >
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="font-display font-semibold mt-6 mb-2" style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-display font-semibold mt-5 mb-1.5" style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>{children}</h3>
                ),
                p: ({ children }) => <p className="mb-4">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                strong: ({ children }) => <strong className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{children}</strong>,
              }}
            >
              {body ?? ''}
            </ReactMarkdown>
          </div>

          {/* Registration CTA */}
          {registration_link && (
            <div
              className="mt-10 border-t pt-8"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <a
                href={registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] px-8 py-3.5 font-sans text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01] focus:outline-none focus-visible:ring-2"
                style={{
                  background: 'var(--color-accent-inti)',
                  boxShadow: '0 2px 12px rgba(200, 16, 46, 0.3)',
                }}
              >
                Register Here →
              </a>
            </div>
          )}
          {/* Expiry bar */}
          {expires_at && (
            <div
              className="mt-6 rounded-xl border px-4 py-3"
              style={{
                background: 'var(--color-surface-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                This announcement expires on{' '}
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {formatDate(expires_at)}
                </span>
              </p>
            </div>
          )}
        </article>
      </main>
    </div>
  )
}
