import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { getCurrentAccessContext } from '@/lib/auth/authz'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentAccessContext()

  return (
    <div className="public-site-shell" data-owner-bar={access ? 'true' : 'false'}>
      <Header access={access} />
      {children}
      <Footer />
    </div>
  )
}
