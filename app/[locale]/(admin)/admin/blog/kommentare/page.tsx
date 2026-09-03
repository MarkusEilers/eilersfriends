import { Link } from '@/lib/i18n/navigation'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { queue, rules, seedCommentRules } from '@/lib/blog/comments'
import { CommentQueue } from '@/components/blog/admin/CommentQueue'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminCommentsPage() {
  await seedCommentRules().catch(() => {})
  const [q, r] = await Promise.all([queue(), rules()])
  return (
    <div>
      <Link href={'/admin/blog' as '/'} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900">
        <ArrowLeft size={13} /> Blog
      </Link>
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
          <MessageSquare size={12} /> Kommentare
        </span>
        <h1 className="mt-1.5 text-2xl font-bold text-gray-900">Freigabe</h1>
        <p className="mt-1 text-sm text-gray-500">
          Was hier liegt, hat eine Regel ausgelöst oder die Summe überschritten. Alles andere steht längst online.
        </p>
      </div>
      <CommentQueue
        initialQueue={q as never}
        initialRules={r as never}
      />
    </div>
  )
}
