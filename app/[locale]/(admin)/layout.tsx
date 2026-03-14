import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (session.user.role !== 'admin' && session.user.role !== 'coach') redirect('/')

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r border-gray-200 bg-ink lg:block" style={{ backgroundColor: '#0D0D0B' }}>
        <div className="p-6">
          <p className="text-sm font-semibold text-white">Coach Backend</p>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">
        {children}
      </main>
    </div>
  )
}
