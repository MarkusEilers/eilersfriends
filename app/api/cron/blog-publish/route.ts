import { NextResponse } from 'next/server'
import { publishDue } from '@/lib/blog/admin'
import { purgeRejected } from '@/lib/blog/comments'

export const runtime = 'nodejs'

/** Was faellig ist, geht raus. Und was abgelehnt wurde, verfaellt nach sechzig Tagen. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const published = await publishDue()
  const purged = await purgeRejected().catch(() => 0)
  return NextResponse.json({ ok: true, published, purged })
}
