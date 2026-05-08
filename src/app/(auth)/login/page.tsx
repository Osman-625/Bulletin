import Image from 'next/image'
import { LockKeyhole, Mail } from 'lucide-react'
import { login } from './actions'

export const metadata = { title: 'Sign In' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="relative w-full max-w-[22rem]">
      <div className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#181919]/95 px-6 py-8 shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)]">
        {/* Top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/[0.13]" aria-hidden="true" />

        {/* 100×100 logo badge */}
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl border border-white/10 bg-[#1e2023] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(200,16,46,0.12),0_8px_24px_rgba(0,0,0,0.4)]">
            <Image
              src="/bulletin_logo.png"
              alt="Bulletin"
              width={60}
              height={60}
              className="h-[60px] w-[60px] object-contain"
              priority
            />
          </div>

          <div className="text-center">
            <h1 className="font-sans text-xl font-semibold tracking-[-0.02em] text-[#f3f6f8]">
              Welcome back
            </h1>
            <p className="mt-1 text-xs text-[#5e686f]">
              INTI International University
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg border border-[#C8102E]/25 bg-[#3d0a10]/60 px-3 py-2.5 text-xs text-[#ffb1ba]"
            role="alert"
            aria-live="polite"
          >
            Invalid email or password. Please try again.
          </div>
        )}

        <form action={login} className="flex flex-col gap-2.5">
          <div className="relative">
            <label htmlFor="email" className="sr-only">Email address</label>
            <Mail
              size={15}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7480]"
              aria-hidden="true"
            />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              className="h-10 w-full rounded-lg border border-white/[0.07] bg-[#101213] px-3 pl-9 text-sm text-[#eef3f7] outline-none transition-[border-color,box-shadow,background] duration-200 placeholder:text-[#636b72] focus:border-[#C8102E]/60 focus:bg-[#130a0b] focus:shadow-[0_0_0_3px_rgba(200,16,46,0.14)]"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <LockKeyhole
              size={15}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7480]"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              className="h-10 w-full rounded-lg border border-white/[0.07] bg-[#101213] px-3 pl-9 text-sm text-[#eef3f7] outline-none transition-[border-color,box-shadow,background] duration-200 placeholder:text-[#636b72] focus:border-[#C8102E]/60 focus:bg-[#130a0b] focus:shadow-[0_0_0_3px_rgba(200,16,46,0.14)]"
            />
          </div>

          <button
            type="submit"
            className="mt-1 h-10 w-full cursor-pointer rounded-lg bg-[#C8102E] text-sm font-semibold text-white shadow-[0_8px_24px_rgba(200,16,46,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[transform,background,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#A80D24] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a97] active:translate-y-0 active:scale-[0.99]"
          >
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-[10px] text-[#3d454b]">
          Authorized personnel only · Bulletin System
        </p>
      </div>
    </main>
  )
}
