import { auth } from '@/lib/auth'
import { currentContext } from '@/lib/actions/strategy'
import { listGoals, goalHistory } from '@/lib/goals/schema'
import { GoalsBoard } from '@/components/goals/GoalsBoard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  const ctx = await currentContext().catch(() => null)
  const goals = ctx?.companyId ? await listGoals(ctx.companyId) : []
  const hist = await goalHistory(goals.map((g) => g.id))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Willkommen, {session?.user?.name}!</p>
      <div className="mt-8">
        {ctx?.companyId ? (
          <>
            <h2 className="text-lg font-bold text-gray-900">Eure Ziele</h2>
            <p className="mb-4 mt-1 text-sm text-gray-500">Woran Marketing, Sales und GTM gemeinsam gemessen werden.</p>
            <GoalsBoard goals={goals} history={hist} compact />
          </>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Das Portal wird gerade aufgebaut. Komm bald wieder!</p>
          </div>
        )}
      </div>
    </div>
  )
}
