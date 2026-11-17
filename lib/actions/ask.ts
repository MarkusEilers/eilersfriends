'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { getFunnel } from '@/lib/ask/registry'
import { saveCalibration } from '@/lib/ask/store'

/** Schwellen je Stufe speichern — wirkt sofort auf neue Teilnahmen, ohne Deploy. */
export async function saveAskCalibrationAction(fd: FormData) {
  const s = await auth()
  if (!s?.user?.role || (s.user.role !== 'admin' && s.user.role !== 'coach')) throw new Error('unauthorized')
  const slug = String(fd.get('funnel') ?? '')
  const f = getFunnel(slug)
  if (!f) throw new Error('unknown funnel')
  const benchmarks: Record<string, { red: number; green: number }> = {}
  for (const st of f.def.stages) {
    const clamp = (v: unknown, d: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : d }
    const red = clamp(fd.get(`red_${st.key}`), f.benchmarks[st.key]?.red ?? 40)
    const green = Math.max(red, clamp(fd.get(`green_${st.key}`), f.benchmarks[st.key]?.green ?? 66))
    benchmarks[st.key] = { red, green }
  }
  await saveCalibration(slug, { benchmarks }, s.user.email ?? s.user.name ?? 'admin')
  revalidatePath('/admin/ask')
}
