import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCheck, getTranscript, deleteTranscript } from '@/lib/call-check/store'

export const dynamic = 'force-dynamic'

async function mayAccess(publicId: string) {
  const session = await auth()
  if (!session?.user?.email) return null
  const check = await getCheck(publicId)
  if (!check) return null
  const isEf = session.user.role === 'admin' || session.user.role === 'coach'
  const isOwner = (check.email ?? '').toLowerCase() === session.user.email.toLowerCase()
  return isEf || isOwner ? check : null
}

async function deleteAction(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '')
  if (!(await mayAccess(id))) return
  await deleteTranscript(id)
  redirect('/dashboard/gespraechs-checks')
}

/** One stored transcript. Only the person who uploaded it (or Eilers+Friends) sees it. */
export default async function CallCheckTranscriptPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/login')
  const check = await mayAccess(id)
  if (!check) notFound()
  const text = await getTranscript(id)

  return (
    <div>
      <a href="/dashboard/gespraechs-checks" className="text-xs font-semibold text-gray-500 hover:text-gray-700">← Deine Gespräche</a>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transkript</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(check.created_at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} · {check.word_count} Wörter
          </p>
        </div>
        <div className="flex gap-2">
          {check.status === 'done' ? (
            <a href={`/${locale}/gespraechs-check/${id}`} className="rounded-full border px-4 py-2 text-xs font-semibold text-[#1A5FD4]">Zur Auswertung</a>
          ) : null}
          {text ? (
            <form action={deleteAction}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                Transkript löschen
              </button>
            </form>
          ) : null}
        </div>
      </div>
      {text ? (
        <pre className="mt-6 max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-gray-100 bg-white p-6 font-sans text-sm leading-relaxed text-gray-800">{text}</pre>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Das Transkript wurde gelöscht. Die Auswertung bleibt erhalten.</p>
      )}
    </div>
  )
}
