'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Mail,
  LayoutTemplate,
  ListOrdered,
  Users,
  FileText,
  Settings,
  ChevronRight,
  BookOpen,
} from 'lucide-react'

const navItems = [
  {
    label: 'Übersicht',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Email-Templates',
    href: '/admin/email-templates',
    icon: Mail,
  },
  {
    label: 'Landing Pages',
    href: '/admin/landing-pages',
    icon: LayoutTemplate,
  },
  {
    label: 'Frameworks',
    href: '/admin/frameworks',
    icon: BookOpen,
  },
  {
    label: 'Email-Sequenzen',
    href: '/admin/email-sequences',
    icon: ListOrdered,
  },
  {
    label: 'Subscriber',
    href: '/admin/subscribers',
    icon: Users,
  },
  {
    label: 'Programme',
    href: '/admin/programs',
    icon: FileText,
  },
  {
    label: 'Einstellungen',
    href: '/admin/settings',
    icon: Settings,
  },
]

interface AdminSidebarProps {
  userName: string
  userRole: string
}

export function AdminSidebar({ userName, userRole }: AdminSidebarProps) {
  const pathname = usePathname()

  // Strip locale prefix for comparison (/en/admin → /admin)
  const cleanPath = pathname.replace(/^\/(de|en|ru)/, '') || '/'

  function isActive(href: string) {
    if (href === '/admin') return cleanPath === '/admin'
    return cleanPath.startsWith(href)
  }

  return (
    <aside className="hidden w-64 shrink-0 lg:flex lg:flex-col" style={{ backgroundColor: '#0A0D14' }}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <p className="text-sm font-bold text-white tracking-tight">
          Eilers<span style={{ color: '#F05A1A' }}>+</span>Friends
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Coach Backend</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={16} className={active ? 'text-orange-400' : ''} />
              {item.label}
              {active && <ChevronRight size={12} className="ml-auto text-gray-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#F05A1A' }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
