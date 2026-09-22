'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { saveSettings } from '@/lib/services/schema'
import { AUDIT_DEFAULTS, type AuditSettings } from '@/lib/services/messaging-audit'

async function guard() {
  const s = await auth()
  if (s?.user?.role !== 'admin' && s?.user?.role !== 'coach') throw new Error('unauthorized')
  return s.user.id ?? null
}

/**
 * Einstellungen speichern.
 *
 * Nur bekannte Felder, und jedes gegen seinen erlaubten Wertebereich. Ein
 * Formular ist eine Eingabe von aussen, auch wenn es hinter dem Admin liegt —
 * und eine „tiefe" von 400 Suchanfragen je Quelle waere teuer.
 */
export async function saveAuditSettings(form: FormData) {
  const userId = await guard()
  const orgId = String(form.get('orgId') ?? '').trim() || null

  const zahl = (name: string, min: number, max: number, fallback: number) => {
    const n = Number(form.get(name))
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback
  }
  const auswahl = <T extends string>(name: string, erlaubt: readonly T[], fallback: T): T => {
    const v = String(form.get(name) ?? '')
    return (erlaubt as readonly string[]).includes(v) ? (v as T) : fallback
  }

  const settings: AuditSettings = {
    tiefe: auswahl('tiefe', ['knapp', 'normal', 'gruendlich'] as const, AUDIT_DEFAULTS.tiefe),
    quellen: form.getAll('quellen').map(String).filter(Boolean),
    suchen_je_quelle: zahl('suchen_je_quelle', 1, 8, AUDIT_DEFAULTS.suchen_je_quelle),
    dimensionen: form.getAll('dimensionen').map(String).filter(Boolean),
    icp_soll: form.get('icp_soll') === 'on',
    benchmark: form.get('benchmark') === 'on',
    ton: auswahl('ton', ['direkt', 'zurueckhaltend'] as const, AUDIT_DEFAULTS.ton),
    doc_serie: (String(form.get('doc_serie') ?? '').trim() || AUDIT_DEFAULTS.doc_serie).slice(0, 8).toUpperCase(),
    broschuere: form.get('broschuere') === 'on',
    bilder: zahl('bilder', 0, 12, AUDIT_DEFAULTS.bilder),
    benachrichtigen: String(form.get('benachrichtigen') ?? '')
      .split(/[\s,;]+/).map((x) => x.trim()).filter((x) => /.+@.+\..+/.test(x)),
  }

  // Ohne Quelle keine Recherche — lieber die Grundeinstellung als ein Lauf,
  // der nichts prueft und trotzdem bewertet.
  if (!settings.quellen.length) settings.quellen = AUDIT_DEFAULTS.quellen
  if (!settings.dimensionen.length) settings.dimensionen = AUDIT_DEFAULTS.dimensionen

  await saveSettings({ serviceKey: 'messaging-audit', orgId, settings, userId })
  revalidatePath('/admin/services/messageaudit')
}
