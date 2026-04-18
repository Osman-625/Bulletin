import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-[#FAFAFA]">
      {/* Brand stripe */}
      <div className="h-[3px] bg-[#1B4332]" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <div>
            <Link
              href="/"
              className="block font-display text-[26px] font-bold uppercase tracking-[0.18em] text-[#09090B] leading-none hover:text-[#1B4332] transition-colors duration-200"
            >
              Bulletin
            </Link>
            <span className="mt-0.5 block font-sans text-[9px] font-medium tracking-[0.3em] uppercase text-[#71717A]">
              INTI International University
            </span>
          </div>

          <Link
            href="/login"
            className="font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-[#71717A] hover:text-[#1B4332] transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Double rule masthead separator */}
      <div className="border-b-[3px] border-[#09090B]" />
      <div className="h-px bg-[#E4E4E7]" />
    </header>
  )
}
