import { cookies } from 'next/headers'
import { getFile } from '@/lib/event-pages/store'
import { cookieName, verify } from '@/lib/event-pages/session'

export const dynamic = 'force-dynamic'

// Nur die eigenen Dateien: getFile prüft slug + id + person.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const person = verify(slug, (await cookies()).get(cookieName(slug))?.value)
  if (person === null) return new Response('Bitte zuerst das Passwort eingeben.', { status: 401 })
  const f = await getFile(slug, person, id)
  if (!f) return new Response('Nicht gefunden', { status: 404 })
  // Wallet-Pässe inline, damit Safari auf dem iPhone direkt „Zu Wallet hinzufügen“ zeigt
  const disp = f.mime === 'application/vnd.apple.pkpass' ? 'inline' : 'attachment'
  return new Response(new Uint8Array(f.data), {
    headers: {
      'Content-Type': f.mime,
      'Content-Disposition': `${disp}; filename="ticket"; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
