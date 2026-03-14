import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  return (
    <div className="flex min-h-screen">
      {/* Portal sidebar will be added in a later phase */}
      <aside className="hidden w-64 border-r border-gray-200 bg-white lg:block">
        <div className="p-6">
          <p className="text-sm font-semibold text-gray-900">Portal</p>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">
        {children}
      </main>
    </div>
  )
}
