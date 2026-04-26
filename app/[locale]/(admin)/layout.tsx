import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (session.user.role !== 'admin' && session.user.role !== 'coach') redirect('/')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar userName={session.user.name ?? ''} userRole={session.user.role ?? ''} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
