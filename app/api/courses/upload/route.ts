import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/lib/auth'
import { lessonAllowed } from '@/lib/actions/courses'

export const runtime = 'nodejs'

/** Token für den direkten Upload einer Homework-Datei aus dem Browser (an Vercel vorbei, bis 200 MB). */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody
  try {
    const out = await handleUpload({
      body, request: req, token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (_path, payload) => {
        const s = await auth()
        if (!s?.user?.id) throw new Error('Nicht angemeldet')
        const ok = await lessonAllowed(s.user.id, s.user.role ?? 'client', String(payload ?? ''))
        if (!ok || ok.lesson.kind !== 'homework') throw new Error('Diese Homework ist für Dich nicht freigeschaltet.')
        return {
          maximumSizeInBytes: 200_000_000, addRandomSuffix: true,
          allowedContentTypes: ['text/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/rtf', 'audio/*', 'video/*', 'image/*'],
        }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
