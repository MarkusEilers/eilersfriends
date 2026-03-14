import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Willkommen, {session?.user?.name}!</p>
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Das Portal wird gerade aufgebaut. Komm bald wieder!</p>
      </div>
    </div>
  )
}
