import { login } from './actions'

export const metadata = { title: 'Sign In' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="font-display text-[30px] font-bold uppercase tracking-[0.2em] text-[#09090B] leading-none">
            Bulletin
          </div>
          <div className="mt-1.5 font-sans text-[9px] font-medium tracking-[0.3em] uppercase text-[#71717A]">
            INTI International University
          </div>
        </div>

        {/* Masthead rule */}
        <div className="h-[3px] bg-[#09090B] mb-0.5" />
        <div className="h-px bg-[#E4E4E7] mb-8" />

        {/* Error */}
        {error && (
          <p className="mb-4 font-sans text-sm text-red-600 text-center" role="alert">
            Invalid email or password.
          </p>
        )}

        <form action={login} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-[#71717A]"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-[#E4E4E7] bg-white px-4 py-2.5 font-sans text-sm text-[#09090B] outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 transition-colors placeholder:text-[#D4D4D8]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-[#71717A]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-[#E4E4E7] bg-white px-4 py-2.5 font-sans text-sm text-[#09090B] outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 transition-colors placeholder:text-[#D4D4D8]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1B4332] text-white font-sans text-[11px] font-medium tracking-[0.18em] uppercase py-3 hover:bg-[#14532D] transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2 mt-2"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
