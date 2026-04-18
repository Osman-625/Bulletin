import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-medium text-zinc-500">404</p>
      <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
      <Link href="/" className="text-sm underline underline-offset-4">
        Back to home
      </Link>
    </div>
  )
}
