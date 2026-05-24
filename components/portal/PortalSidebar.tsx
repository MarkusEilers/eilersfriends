'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOutAdminAction } from '@/lib/actions/offers'
import { LayoutDashboard, FileSignature, User, Menu, X, LogOut, BookOpen, GraduationCap, Shield } from 'lucide-react'

const PORTAL_NAV = [
  { label: 'Dashboard',        href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Meine Frameworks', href: '/dashboard/frameworks', icon: BookOpen },
  { label: 'Meine Programme',  href: '/dashboard/programs',   icon: GraduationCap },
  { label: 'Angebote',         href: '/clients',              icon: FileSignature },
  { label: 'Profil',           href: '/dashboard/profile',    icon: User },
]

interface PortalSidebarProps {
  userName: string
  userRole: string
}

export function PortalSidebar({ userName, userRole }: PortalSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const cleanPath = pathname.replace(/^\/(de|en|es|ru)/, '') || '/'

  function isActive(href: string) {
    return cleanPath === href || cleanPath.startsWith(href + '/')
  }

  const NavContent = (
    <>
      <div className="px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <p className="text-base font-bold text-gray-900 tracking-tight">
            Eilers<span style={{ color: '#1A5FD4' }}>+</span>Friends
          </p>
        </Link>
        <p className="mt-0.5 text-[11px] uppercase tracking-widest text-gray-400">Kundenbereich</p>
      </div>
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {PORTAL_NAV.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href as '/'}
              onClick={() => setOpen(false)}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {active && (
                <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full" style={{ backgroundColor: '#1A5FD4' }} />
              )}
              <Icon size={15} className={active ? 'text-blue-600' : 'text-gray-400'} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      {(userRole === 'admin' || userRole === 'coach') && (
        <Link
          href={'/admin' as '/'}
          onClick={() => setOpen(false)}
          className="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-purple-50 hover:text-purple-700 transition-colors border border-dashed border-gray-300"
        >
          <Shield size={13} className="text-purple-500" />
          Zum Admin-Panel
        </Link>
      )}
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#1A5FD4' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-[10px] capitalize text-gray-500">{userRole}</p>
            </div>
          </div>
          <form action={signOutAdminAction}>
            <button
              type="submit"
              title="Abmelden"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="text-sm font-bold text-gray-900">
          Eilers<span style={{ color: '#1A5FD4' }}>+</span>Friends
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
          aria-label="Menü öffnen"
        >
          <Menu size={16} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Menü schließen"
              >
                <X size={16} />
              </button>
            </div>
            {NavContent}
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex lg:sticky lg:top-0 lg:h-screen">
        {NavContent}
      </aside>
    </>
  )
}
