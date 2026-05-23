import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PortalSidebar } from '@/components/portal/PortalSidebar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PortalSidebar userName={session.user?.name ?? ''} userRole={session.user?.role ?? ''} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
