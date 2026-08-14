import { Check, Clock, Eye, PenLine, RotateCcw, Lock } from 'lucide-react'

export type StepStatus = 'locked' | 'available' | 'in_progress' | 'submitted' | 'in_review' | 'changes_requested' | 'approved'

const MAP: Record<StepStatus, { label: string; bg: string; fg: string; icon: React.ElementType }> = {
  locked:            { label: 'Gesperrt',        bg: '#F3F4F6', fg: '#9CA3AF', icon: Lock },
  available:         { label: 'Offen',           bg: '#F3F4F6', fg: '#6B7280', icon: Clock },
  in_progress:       { label: 'In Arbeit',       bg: '#EBF1FF', fg: '#1A5FD4', icon: PenLine },
  submitted:         { label: 'Eingereicht',     bg: '#FFF4E5', fg: '#B45309', icon: Clock },
  in_review:         { label: 'In Prüfung',      bg: '#F5F0FF', fg: '#6D28D9', icon: Eye },
  changes_requested: { label: 'Überarbeiten',    bg: '#FEF2F2', fg: '#B42318', icon: RotateCcw },
  approved:          { label: 'Freigegeben',     bg: '#ECFDF3', fg: '#067647', icon: Check },
}

export function StatusBadge({ status, size = 'sm' }: { status: StepStatus; size?: 'sm' | 'md' }) {
  const s = MAP[status] ?? MAP.available
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]'}`}
      style={{ backgroundColor: s.bg, color: s.fg }}>
      <Icon size={size === 'md' ? 13 : 11} /> {s.label}
    </span>
  )
}

export function statusLabel(status: StepStatus) { return (MAP[status] ?? MAP.available).label }
