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
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/bulletin_logo.png"
            alt="Bulletin"
            width={56}
            height={56}
            className="mb-4 h-14 w-14 object-contain"
            priority
          />

          <h2
            className="font-display text-[23px] font-bold leading-tight mb-1.5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Welcome back
          </h2>
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            Sign in to access Bulletin
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
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@inti.edu.my"
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

        {/* Footer note */}
        <div
          className="mt-6 border-t pt-5 text-center text-[12px]"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          INTI Bulletin is for authorized personnel only.
        </div>
      </div>
    </>
  )
}
