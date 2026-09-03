import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listAll, getById, savePost, deletePost, knownTags } from '@/lib/blog/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

async function guard() {
  const s = await auth()
  const r = s?.user?.role
  return r === 'admin' || r === 'coach' ? s : null
}

export async function GET(req: Request) {
  const s = await guard()
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (id) {
    const post = await getById(id)
    if (!post) return NextResponse.json({ error: 'nicht gefunden' }, { status: 404 })
    return NextResponse.json({ ok: true, post, tags: await knownTags(post.author_slug) })
  }
  return NextResponse.json({
    ok: true,
    posts: await listAll({ author: url.searchParams.get('author'), status: url.searchParams.get('status') }),
    tags: await knownTags(url.searchParams.get('author')),
  })
}

export async function POST(req: Request) {
  const s = await guard()
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.title?.trim()) return NextResponse.json({ error: 'Ein Titel ist Pflicht' }, { status: 400 })
  const post = await savePost({ ...body, userId: s.user?.id ?? null })
  return NextResponse.json({ ok: true, post })
}

export async function DELETE(req: Request) {
  const s = await guard()
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id ist Pflicht' }, { status: 400 })
  await deletePost(id)
  return NextResponse.json({ ok: true })
}
