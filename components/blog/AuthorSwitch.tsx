import { Link } from '@/lib/i18n/navigation'
import Image from 'next/image'
import { AUTHOR_LIST } from '@/lib/blog/authors'

/**
 * Die Umschaltung zwischen den Autoren. Sie steht oben und nicht als Filter am
 * Rand, weil sie keine Verfeinerung ist, sondern eine Entscheidung: Wen will ich
 * gerade lesen?
 */
export function AuthorSwitch({
  active, counts,
}: { active?: 'markus' | 'aljona' | null; counts?: Record<string, number> }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Link
        href={'/blog' as '/'}
        className="rounded-full border px-4 py-2 text-xs font-bold transition-colors"
        style={
          active
            ? { borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)' }
            : { borderColor: 'transparent', background: '#fff', color: '#0D0D0B' }
        }
      >
        Alle Beiträge
      </Link>
      {AUTHOR_LIST.map((a) => {
        const on = active === a.slug
        return (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}` as '/'}
            className="inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-xs font-bold transition-colors"
            style={
              on
                ? { borderColor: 'transparent', background: '#fff', color: '#0D0D0B' }
                : { borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)' }
            }
          >
            <span className="relative h-6 w-6 overflow-hidden rounded-full">
              <Image src={a.avatar} alt="" fill sizes="24px" className="object-cover" />
            </span>
            {a.name.split(' ')[0]}
            {counts?.[a.slug] ? (
              <span className="opacity-50">{counts[a.slug]}</span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
