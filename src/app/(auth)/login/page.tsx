import Image from 'next/image'
import { login } from './actions'

export const metadata = { title: 'Sign In' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <>
      {/* Full-screen radial bloom (fixed, behind everything) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 35% 45%, rgba(200,16,46,0.06) 0%, transparent 100%)',
        }}
      />

      {/* Card — AuthLayout handles centering */}
      <div
        className="animate-fade-up w-full max-w-[420px] rounded-2xl border p-10"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 4px 40px rgba(0, 0, 0, 0.09)',
        }}
      >
        {/* Masthead */}
        <div className="mb-8">
          <div className="mb-5 flex items-center gap-3">
            <Image
              src="/bulletin_logo.png"
              alt="Bulletin"
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 object-contain"
              priority
            />
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--color-accent-inti)' }}
              >
                INTI International University
              </p>
              <p
                className="font-display text-[22px] font-bold leading-none tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Bulletin
              </p>
            </div>
          </div>

          {/* Rule */}
          <div className="mb-5">
            <div className="h-[2px] w-8 rounded-full" style={{ background: 'var(--color-accent-inti)' }} />
            <div className="mt-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          <h1
            className="font-display text-[28px] font-bold leading-[1.1] tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Publisher<br />sign-in
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            Authorized personnel only.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="animate-slide-in mb-5 rounded-[10px] border px-4 py-3 text-[13px]"
            style={{
              background: 'var(--color-accent-surface)',
              borderColor: 'var(--color-accent-inti)',
              color: 'var(--color-accent-inti)',
            }}
            role="alert"
          >
            Invalid email or password.
          </div>
        )}

        {/* Form */}
        <form action={login} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Email or username
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email or username"
              className="input-inti w-full rounded-[10px] border px-4 py-2.5 text-[14px] transition-all duration-150 placeholder:opacity-40"
              style={{
                background: 'var(--color-surface-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="input-inti w-full rounded-[10px] border px-4 py-2.5 text-[14px] transition-all duration-150 placeholder:opacity-40"
              style={{
                background: 'var(--color-surface-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full cursor-pointer rounded-[10px] py-3 font-sans text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'var(--color-accent-inti)',
              boxShadow: '0 2px 12px rgba(200, 16, 46, 0.28)',
            }}
          >
            Sign in
          </button>
        </form>

      </div>
    </>
  )
}
