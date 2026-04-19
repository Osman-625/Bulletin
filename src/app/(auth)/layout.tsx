export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[var(--color-canvas)] overflow-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--color-accent)]/8 blur-[120px]" />
        <div className="absolute -bottom-[5%] -right-[5%] w-[30%] h-[30%] rounded-full bg-[var(--color-secondary-accent)]/5 blur-[100px]" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
