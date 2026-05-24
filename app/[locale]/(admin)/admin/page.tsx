import { auth } from '@/lib/auth'
import { getDashboardStats } from '@/lib/analytics/dashboard'
import { DashboardOverview } from '@/components/admin/DashboardOverview'

// Don't pre-render — stats must be fresh on every visit.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboardPage() {
  const session = await auth()
  const stats = await getDashboardStats().catch((err) => {
    console.error('[admin/page] getDashboardStats failed:', err)
    return {
      subscribers: { today: 0, last7d: 0, last30d: 0, total: 0 },
      sequenceSends: { today: 0, last7d: 0, last30d: 0, total: 0 },
      pageViews: { today: 0, last7d: 0, last30d: 0, total: 0 },
      uniqueVisitors: { today: 0, last7d: 0, last30d: 0, total: 0 },
      topPaths: [],
      topReferrers: [],
      recentEvents: [],
    }
  })

  return (
    <DashboardOverview
      stats={stats}
      userName={session?.user?.name ?? 'Coach'}
      userRole={session?.user?.role ?? 'admin'}
    />
  )
}
