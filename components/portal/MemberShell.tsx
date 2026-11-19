'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Home, Layers, Diamond, TrendingUp, Map as MapIcon, Compass, Radar, Shield, Menu, X, Bell, ChevronRight, LogOut,
  User, Receipt, FileSignature, Search, Upload, CircleCheck,
} from 'lucide-react'
import { signOutAdminAction } from '@/lib/actions/offers'

export interface ShellMember { name: string; initials: string; avatarUrl: string | null; subtitle: string; plans: { label: string; kind: string }[] }
export interface ShellNotice { id: string; title: string; sub: string; href: string }
export interface ShellNav { guide: boolean; strategy: boolean; leadradar: boolean; admin: boolean }

const ink = '#0D0D0B', muted = '#605D5D', line = '#E6E3E1'

export function Avatar({ m, size = 40 }: { m: { initials: string; avatarUrl: string | null; name?: string }; size?: number }) {
  return m.avatarUrl
    ? <img src={m.avatarUrl} alt={m.name ?? ''} className="flex-none rounded-full object-cover" style={{ width: size, height: size }} />
    : <span className="flex flex-none items-center justify-center rounded-full font-bold" style={{ width: size, height: size, background: '#C9D8F5', color: '#124293', fontSize: Math.round(size * 0.35) }}>{m.initials}</span>
}

/** Rahmen der Member-Section: Navigation links mit Profilkarte, Kopfzeile mit Suche (Eily), Stand und Glocke. */
export function MemberShell({ member, notices, nav, score, children }: { member: ShellMember; notices: ShellNotice[]; nav: ShellNav; score: { value: number; delta: number | null } | null; children: React.ReactNode }) {
  const pathname = usePathname() || '/dashboard'
  const clean = pathname.replace(/^\/(de|en|es|ru)(?=\/|$)/, '') || '/'
  const [open, setOpen] = useState(false)
  const [bell, setBell] = useState(false)
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const compact = clean.startsWith('/dashboard/strategie')

  const items = [
    { label: 'Start', href: '/dashboard', icon: Home, exact: true },
    { label: 'Meine Programme', href: '/dashboard/programs', icon: Layers },
    ...(nav.guide ? [{ label: 'Programm Guide', href: '/dashboard/guide', icon: MapIcon }] : []),
    { label: 'Meine Frameworks', href: '/dashboard/frameworks', icon: Diamond },
    { label: 'Mein Score', href: '/dashboard/score', icon: TrendingUp },
    ...(nav.strategy ? [{ label: 'Strategie', href: '/dashboard/strategie', icon: Compass }] : []),
    ...(nav.leadradar ? [{ label: 'Lead-Radar', href: '/dashboard/leadradar', icon: Radar }] : []),
  ]
  const active = (href: string, exact?: boolean) => (exact ? clean === href : clean === href || clean.startsWith(href + '/')) || (href === '/dashboard/score' && clean.startsWith('/dashboard/gespraechs-checks'))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { setOpen(false); setBell(false); setMenu(false) }, [pathname])

  function ask(e: React.FormEvent) {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('ef:chat', { detail: { text: q.trim() } }))
    setQ('')
  }

  const Nav = ({ iconsOnly = false }: { iconsOnly?: boolean }) => (
    <div className="flex h-full flex-col">
      <Link href={'/dashboard' as '/'} className={`flex items-end gap-1.5 ${iconsOnly ? 'justify-center px-0' : 'px-3'} pb-6`} aria-label="Eilers+Friends">
        {iconsOnly ? <svg width="28" height="18" viewBox="0 0 22 14" aria-hidden="true"><path d="M2 12C8 12 16 9 20 2" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" /></svg> : (<>
          <img src="/ef-logo.png" alt="Eilers+Friends" className="h-12 w-auto" />
        </>)}
      </Link>
      <nav className="flex flex-col gap-0.5">
        {items.map((it) => {
          const I = it.icon, on = active(it.href, it.exact)
          return (
            <Link key={it.href} href={it.href as '/'} title={iconsOnly ? it.label : undefined}
              className={`flex items-center gap-3 rounded-xl ${iconsOnly ? 'justify-center px-2' : 'px-3'} py-2.5 text-[15px] transition-colors ${on ? 'font-semibold' : 'font-medium hover:bg-[#F5F4F2]'}`}
              style={{ color: on ? '#124293' : '#3A3836', background: on ? '#EBF1FF' : undefined }}>
              <I size={20} strokeWidth={1.8} color={on ? '#124293' : muted} className="flex-none" />{!iconsOnly && it.label}
            </Link>
          )
        })}
        {nav.admin && (
          <Link href={'/admin' as '/'} title="Admin" className={`mt-3 flex items-center gap-3 rounded-xl border border-dashed ${iconsOnly ? 'justify-center px-2' : 'px-3'} py-2 text-[13px] font-semibold text-gray-500 hover:bg-purple-50 hover:text-purple-700`} style={{ borderColor: line }}>
            <Shield size={16} className="text-purple-500" />{!iconsOnly && 'Zum Admin-Panel'}
          </Link>
        )}
      </nav>
      <div className="min-h-10 flex-1" />
      {/* Profilkarte unten links */}
      <div className="relative">
        <button type="button" onClick={() => setMenu((x) => !x)} aria-expanded={menu}
          className={`flex w-full flex-col gap-2.5 rounded-2xl border bg-white text-left transition-shadow hover:shadow-md ${iconsOnly ? 'items-center p-2' : 'p-3.5'}`} style={{ borderColor: line, color: ink }}>
          <span className="flex w-full items-center gap-2.5">
            <Avatar m={member} size={40} />
            {!iconsOnly && <>
              <span className="flex min-w-0 flex-col gap-0.5"><span className="truncate text-[15px] font-bold">{member.name}</span><span className="truncate text-[12px]" style={{ color: muted }}>{member.subtitle}</span></span>
              <ChevronRight size={16} className="ml-auto flex-none" color={muted} />
            </>}
          </span>
          {!iconsOnly && member.plans.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {member.plans.slice(0, 3).map((p) => (
                <span key={p.label} className="whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold"
                  style={p.kind === 'corporate' ? { border: '1.5px solid #C9D8F5', color: '#124293', background: '#EBF1FF' } : { border: `1.5px solid ${line}`, color: '#3A3836', background: '#fff' }}>{p.label}</span>
              ))}
            </span>
          )}
        </button>
        {menu && (
          <div className={`absolute bottom-full mb-2 w-60 overflow-hidden rounded-2xl border bg-white py-1.5 shadow-xl ${iconsOnly ? 'left-0' : 'left-0 right-0 w-auto'}`} style={{ borderColor: line }}>
            {[
              { href: '/dashboard/profile', label: 'Profil bearbeiten', icon: User },
              { href: '/dashboard/billing', label: 'Abos und Rechnungen', icon: Receipt },
              { href: '/clients', label: 'Angebote', icon: FileSignature },
            ].map((x) => <Link key={x.href} href={x.href as '/'} className="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-[#F5F4F2]" style={{ color: '#3A3836' }}><x.icon size={16} color={muted} />{x.label}</Link>)}
            <form action={signOutAdminAction}><button type="submit" className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-[#F5F4F2]" style={{ color: '#3A3836' }}><LogOut size={16} color={muted} />Abmelden</button></form>
          </div>
        )}
      </div>
      {!iconsOnly && <span className="px-1 pt-1.5 text-[12px]" style={{ color: muted }}>Profil, Abos und Rechnungen</span>}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]" style={{ fontFamily: "'DM Sans', Arial, sans-serif", color: ink }}>
      {/* Seitenleiste */}
      <aside className={`sticky top-0 hidden h-screen flex-none border-r bg-white lg:block ${compact ? 'w-[76px] px-2.5' : 'w-[248px] px-[18px]'} py-7`} style={{ borderColor: line }}>
        <Nav iconsOnly={compact} />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] bg-white px-[18px] py-6 shadow-xl">
            <button type="button" onClick={() => setOpen(false)} aria-label="Menü schließen" className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
            <Nav />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Kopfzeile */}
        <header className="sticky top-0 z-40 flex h-[72px] items-center gap-3 border-b bg-white/95 px-4 backdrop-blur sm:gap-[18px] sm:px-8" style={{ borderColor: line }}>
          <button type="button" onClick={() => setOpen(true)} aria-label="Menü öffnen" className="rounded-lg border p-2 lg:hidden" style={{ borderColor: line }}><Menu size={18} /></button>
          <form onSubmit={ask} className="flex h-12 max-w-[620px] flex-1 items-center gap-2.5 rounded-full bg-[#F6F7FB] px-4" style={{ color: muted }}>
            <img src="/eili/eili.jpg" alt="Eily" className="-ml-2 h-[30px] w-[30px] rounded-full object-cover" />
            <label htmlFor="member-search" className="sr-only">Suche</label>
            <input id="member-search" ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Frag Eily oder suche in allen Inhalten …"
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] outline-none" style={{ color: ink }} />
            <span className="hidden rounded-md border bg-white px-1.5 py-0.5 text-[12px] sm:inline" style={{ borderColor: line }}>⌘K</span>
            <button type="submit" aria-label="Eily fragen" className="sm:hidden"><Search size={16} /></button>
          </form>
          <div className="hidden flex-1 md:block" />
          {score && (
            <Link href={'/dashboard/score' as '/'} className="hidden min-w-[180px] flex-col gap-1.5 md:flex" title="Dein Gesprächs-Score">
              <span className="flex justify-between text-[12px]"><b>Score {score.value}</b>{score.delta !== null && <span style={{ color: score.delta >= 0 ? '#16955C' : '#B0001F' }}>{score.delta >= 0 ? '+' : ''}{score.delta} seit dem ersten Check</span>}</span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-[#E9E6E4]"><span className="block h-1.5 rounded-full bg-[#1A5FD4]" style={{ width: `${Math.min(100, score.value)}%` }} /></span>
            </Link>
          )}
          <div className="relative">
            <button type="button" onClick={() => setBell((x) => !x)} aria-label={`Benachrichtigungen, ${notices.length} offen`} aria-expanded={bell}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border bg-white" style={{ borderColor: line, color: '#3A3836' }}>
              <Bell size={18} />
              {notices.length > 0 && <span className="absolute right-[9px] top-2 h-[9px] w-[9px] rounded-full border-2 border-white bg-[#E0452E]" />}
            </button>
            {bell && (
              <div className="absolute right-0 top-[52px] w-[340px] max-w-[90vw] overflow-hidden rounded-2xl border bg-white shadow-2xl" style={{ borderColor: line }}>
                <p className="px-4 pb-2 pt-3.5 text-[13px] font-bold">What&apos;s next</p>
                {notices.length === 0 ? (
                  <p className="flex items-center gap-2 px-4 pb-4 text-[14px]" style={{ color: muted }}><CircleCheck size={16} color="#16955C" />Alles erledigt.</p>
                ) : notices.map((n) => (
                  <Link key={n.id} href={n.href as '/'} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F5F4F2]">
                    <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#EBF1FF]"><Upload size={15} color="#1A5FD4" /></span>
                    <span className="min-w-0"><span className="block text-[14px] font-semibold leading-snug">{n.title}</span><span className="block text-[12px]" style={{ color: muted }}>{n.sub}</span></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href={'/dashboard/profile' as '/'} aria-label="Profil" className="hidden sm:block"><Avatar m={member} size={40} /></Link>
        </header>
        <main className="w-full min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
