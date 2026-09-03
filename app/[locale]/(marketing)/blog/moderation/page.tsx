import { ModerationConfirm } from '@/components/blog/admin/ModerationConfirm'

export const dynamic = 'force-dynamic'

/**
 * Die Seite hinter dem Knopf in der Mail.
 *
 * Sie zeigt nichts als eine Bestaetigung — und genau das ist ihr Zweck: waere
 * die Freigabe schon der Aufruf des Links, wuerde der erste Virenscanner, der
 * die Nachricht oeffnet, jeden Kommentar freischalten.
 */
export default async function ModerationPage({
  searchParams,
}: { searchParams: Promise<{ c?: string; a?: string; t?: string }> }) {
  const sp = await searchParams
  if (!sp.c || !sp.a || !sp.t) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6" style={{ background: '#FAFAF8' }}>
        <p className="text-sm text-gray-500">Dieser Link ist unvollständig.</p>
      </main>
    )
  }
  return <ModerationConfirm id={sp.c} action={sp.a} token={sp.t} />
}
