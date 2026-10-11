import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { companyForUser, loadGuide } from '@/lib/rollouts/guide'
import { GuideClient } from '@/components/guide/GuideClient'

export const dynamic = 'force-dynamic'

/**
 * Programm Guide — der erste Eintrag im Kundenbereich.
 * Eilers+Friends (admin/coach) kann mit ?company=<id> jede Firma ansehen.
 */
export default async function GuidePage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const s = await auth()
  if (!s?.user?.id) redirect('/auth/login')
  const { company } = await searchParams
  const isEf = s.user.role === 'admin' || s.user.role === 'coach'
  const companyId = (isEf && company) ? company : await companyForUser(s.user.id)
  const guide = companyId ? await loadGuide(companyId, s.user.id, s.user.role) : null

  if (!guide || !guide.programs.length) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Programm Guide</h1>
        <p className="mt-3 text-sm text-gray-500">
          Sobald Euer Programm startet, steht hier jeder Schritt: wann er dran ist, wer dabei ist, was Ihr mitbringt und was danach vorliegt.
        </p>
      </div>
    )
  }
  return <GuideClient guide={guide} today={new Date().toISOString().slice(0, 10)} />
}
