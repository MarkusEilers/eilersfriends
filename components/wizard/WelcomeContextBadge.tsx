'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Building2, ChevronRight } from 'lucide-react'

interface Profile {
  organisationName?: string
  website?: string
  summary?: string
  valueProposition?: string
  targetAudience?: string
  keywords?: string[]
}

export function WelcomeContextBadge() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wizard/company').then((r) => r.json()).then((data) => {
      if (data?.profile) {
        const p = data.profile as Record<string, unknown>
        setProfile({
          organisationName: (p.organisation_name as string) ?? undefined,
          website: (p.website as string) ?? undefined,
          summary: (p.summary as string) ?? undefined,
          valueProposition: (p.value_proposition as string) ?? undefined,
          targetAudience: (p.target_audience as string) ?? undefined,
          keywords: (p.keywords as string[]) ?? [],
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return null

  if (!profile?.summary) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 max-w-prose">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">Welcome noch offen</p>
        <p className="text-xs leading-relaxed text-amber-900">
          Trag oben kurz die Website ein — die AI nutzt das als Kontext für alle folgenden Schritte. So muss es hier unten nicht doppelt eingegeben werden.
        </p>
        <Link href={'#step-00-welcome' as '/'} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900">
          Zum Welcome-Schritt <ChevronRight size={11} />
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 max-w-prose">
      <div className="flex items-start gap-2">
        <CheckCircle2 size={14} className="text-green-700 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-800 mb-0.5">AI nutzt Welcome-Profile</p>
          <p className="text-xs text-gray-800">
            <Building2 size={11} className="inline -mt-0.5 mr-1 text-gray-600" />
            <span className="font-semibold">{profile.organisationName ?? profile.website}</span>
            {profile.targetAudience ? <span className="text-gray-600"> · {profile.targetAudience.slice(0, 60)}{profile.targetAudience.length > 60 ? '…' : ''}</span> : null}
          </p>
        </div>
      </div>
    </div>
  )
}
