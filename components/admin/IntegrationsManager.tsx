'use client'

import { useState, useTransition } from 'react'
import { Webhook, Key, Activity, Plus, Trash2, CheckCircle2, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react'
import {
  createWebhookSubscription, updateWebhookSubscription, deleteWebhookSubscription,
  createApiKey, revokeApiKey, triggerWebhookDelivery,
} from '@/lib/actions/integrations'

interface WebhookRow {
  id: string; name: string; url: string; event_types: unknown; active: boolean
  last_delivery_at: string | null; last_delivery_status: string | null
  total_delivered: number; total_failed: number; notes: string | null
}
interface ApiKeyRow {
  id: string; name: string; prefix: string; scopes: unknown; active: boolean
  last_used_at: string | null; created_at: string; expires_at: string | null
}
interface EventRow {
  id: string; category: string; type: string; source: string; occurred_at: string
}

const COMMON_EVENT_TYPES = [
  { value: '*', label: 'Alle Events' },
  { value: 'subscriber.*', label: 'Subscriber (DOI, Unsubscribe)' },
  { value: 'framework.*', label: 'Framework (Started, Step, Completed)' },
  { value: 'offer.*', label: 'Offer (Viewed, Signed, Paid)' },
  { value: 'member.*', label: 'Member (Join, Level-Up)' },
  { value: 'community.*', label: 'Community (Posts, Likes)' },
]

const COMMON_SCOPES = [
  { value: '*', label: 'Vollzugriff (Master-Key)' },
  { value: 'events:read', label: 'Events lesen' },
  { value: 'events:write', label: 'Events schreiben' },
  { value: 'subscribers:read', label: 'Subscribers lesen' },
  { value: 'mcp:read', label: 'MCP (für AI-Tools)' },
]

export function IntegrationsManager({ webhooks, apiKeys, recentEvents }: {
  webhooks: WebhookRow[]; apiKeys: ApiKeyRow[]; recentEvents: EventRow[]
}) {
  const [tab, setTab] = useState<'webhooks' | 'keys' | 'events'>('webhooks')
  const [pending, startTransition] = useTransition()
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  // Webhook form
  const [whName, setWhName] = useState('')
  const [whUrl, setWhUrl] = useState('')
  const [whTypes, setWhTypes] = useState<string[]>(['*'])
  const [whSecret, setWhSecret] = useState<string | null>(null)

  // API-Key form
  const [keyName, setKeyName] = useState('')
  const [keyScopes, setKeyScopes] = useState<string[]>(['mcp:read'])
  const [newToken, setNewToken] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)

  function createWebhook() {
    if (!whName.trim() || !whUrl.trim()) return
    startTransition(async () => {
      try {
        const res = await createWebhookSubscription({ name: whName, url: whUrl, eventTypes: whTypes })
        setWhSecret(res.secret)
        setFlash({ type: 'ok', msg: 'Webhook erstellt. Secret unten kopieren — wird nur einmal gezeigt.' })
        setWhName(''); setWhUrl(''); setWhTypes(['*'])
      } catch (e) {
        setFlash({ type: 'err', msg: e instanceof Error ? e.message : 'Fehler' })
      }
    })
  }

  function deleteWh(id: string) {
    if (!confirm('Webhook löschen?')) return
    startTransition(async () => {
      try { await deleteWebhookSubscription(id); setFlash({ type: 'ok', msg: 'Gelöscht' }) }
      catch (e) { setFlash({ type: 'err', msg: String(e) }) }
    })
  }

  function toggleWh(id: string, active: boolean) {
    startTransition(async () => {
      await updateWebhookSubscription(id, { active: !active }).catch(() => {})
    })
  }

  function createKey() {
    if (!keyName.trim()) return
    startTransition(async () => {
      try {
        const res = await createApiKey({ name: keyName, scopes: keyScopes })
        setNewToken(res.token)
        setShowToken(true)
        setFlash({ type: 'ok', msg: 'Key erstellt. Token unten kopieren — wird nur einmal gezeigt.' })
        setKeyName(''); setKeyScopes(['mcp:read'])
      } catch (e) {
        setFlash({ type: 'err', msg: e instanceof Error ? e.message : 'Fehler' })
      }
    })
  }

  function revoke(id: string) {
    if (!confirm('API-Key revoken?')) return
    startTransition(async () => {
      await revokeApiKey(id)
      setFlash({ type: 'ok', msg: 'Revoked' })
    })
  }

  function triggerNow() {
    startTransition(async () => {
      const res = await triggerWebhookDelivery()
      setFlash({ type: 'ok', msg: `Delivered ${res.delivered}, failed ${res.failed} across ${res.subs} subs` })
    })
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <TabButton active={tab === 'webhooks'} onClick={() => setTab('webhooks')} icon={<Webhook size={14}/>}>
          Outgoing Webhooks <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">{webhooks.length}</span>
        </TabButton>
        <TabButton active={tab === 'keys'} onClick={() => setTab('keys')} icon={<Key size={14}/>}>
          API-Keys <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">{apiKeys.filter(k => k.active).length}</span>
        </TabButton>
        <TabButton active={tab === 'events'} onClick={() => setTab('events')} icon={<Activity size={14}/>}>
          Event-Stream <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">{recentEvents.length}</span>
        </TabButton>
      </div>

      {flash && (
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
          flash.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {flash.type === 'ok' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
          {flash.msg}
        </div>
      )}

      {/* Webhooks Tab */}
      {tab === 'webhooks' && (
        <div className="space-y-6">
          {/* Create form */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Neuen Webhook anlegen</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-700">Name</label>
                <input value={whName} onChange={(e) => setWhName(e.target.value)} placeholder="Zapier / Make / Beehiiv / ..."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">URL</label>
                <input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://hooks.zapier.com/..."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-700">Event-Typen (mehrfach möglich)</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COMMON_EVENT_TYPES.map(t => {
                    const on = whTypes.includes(t.value)
                    return (
                      <button key={t.value} type="button"
                        onClick={() => setWhTypes(on ? whTypes.filter(x => x !== t.value) : [...whTypes, t.value])}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          on ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={createWebhook} disabled={pending || !whName.trim() || !whUrl.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                <Plus size={14} /> Webhook anlegen
              </button>
              <button onClick={triggerNow} disabled={pending} className="text-xs font-semibold text-gray-500 underline hover:text-gray-900">
                Sofort liefern (Debug)
              </button>
            </div>

            {whSecret && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">
                  Webhook-Secret (wird NUR jetzt gezeigt)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-white px-3 py-2 text-xs font-mono text-amber-900 border border-amber-200">{whSecret}</code>
                  <button onClick={() => { navigator.clipboard.writeText(whSecret); setFlash({ type: 'ok', msg: 'Kopiert' }) }}
                    className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                    <Copy size={12} className="inline" /> Kopieren
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-amber-700">
                  HMAC-SHA256 mit diesem Secret signiert den Payload. Header: <code>X-EF-Signature: sha256=&lt;hex&gt;</code>
                </p>
              </div>
            )}
          </section>

          {/* List */}
          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Aktive Webhooks</h2>
            </div>
            {webhooks.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-gray-400">Noch keine Webhooks. Leg einen oben an.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {webhooks.map(w => {
                  const types = Array.isArray(w.event_types) ? (w.event_types as string[]) : []
                  return (
                    <li key={w.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm">{w.name}</strong>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              w.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {w.active ? 'aktiv' : 'pausiert'}
                            </span>
                            {w.last_delivery_status && (
                              <span className={`text-[10px] font-mono ${
                                w.last_delivery_status === 'ok' ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                last: {w.last_delivery_status}
                              </span>
                            )}
                          </div>
                          <code className="block mt-1 truncate text-xs font-mono text-gray-500">{w.url}</code>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {types.map(t => <span key={t} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-blue-700">{t}</span>)}
                          </div>
                          <p className="mt-1.5 text-[10px] text-gray-400">
                            ✓ {w.total_delivered} delivered · ✗ {w.total_failed} failed
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <button onClick={() => toggleWh(w.id, w.active)} className="text-[10px] font-semibold text-blue-600 hover:underline">
                            {w.active ? 'Pausieren' : 'Aktivieren'}
                          </button>
                          <button onClick={() => deleteWh(w.id)} className="text-[10px] font-semibold text-red-500 hover:underline">
                            <Trash2 size={10} className="inline" /> Löschen
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* API-Keys Tab */}
      {tab === 'keys' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Neuen API-Key anlegen</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-700">Name</label>
                <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Claude / Cowork / Zapier / ..."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Scopes</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COMMON_SCOPES.map(s => {
                    const on = keyScopes.includes(s.value)
                    return (
                      <button key={s.value} type="button"
                        onClick={() => setKeyScopes(on ? keyScopes.filter(x => x !== s.value) : [...keyScopes, s.value])}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          on ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <button onClick={createKey} disabled={pending || !keyName.trim()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
              <Plus size={14} /> Key erzeugen
            </button>

            {newToken && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">
                  API-Key (wird NUR jetzt gezeigt)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-white px-3 py-2 text-xs font-mono text-amber-900 border border-amber-200">
                    {showToken ? newToken : newToken.replace(/.(?=.{8})/g, '•')}
                  </code>
                  <button onClick={() => setShowToken(!showToken)} className="text-amber-600">
                    {showToken ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(newToken); setFlash({ type: 'ok', msg: 'Kopiert' }) }}
                    className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                    <Copy size={12} className="inline" /> Kopieren
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-amber-700">
                  Verwendung: <code>Authorization: Bearer {newToken.slice(0, 12)}...</code>
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">API-Keys</h2>
            </div>
            {apiKeys.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-gray-400">Noch keine Keys. Leg einen an für Claude/Cowork/Zapier-Anbindung.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {apiKeys.map(k => {
                  const scopes = Array.isArray(k.scopes) ? (k.scopes as string[]) : []
                  return (
                    <li key={k.id} className="px-6 py-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm">{k.name}</strong>
                          <code className="text-xs font-mono text-gray-400">{k.prefix}_•••</code>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            k.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {k.active ? 'aktiv' : 'revoked'}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {scopes.map(s => <span key={s} className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-mono text-purple-700">{s}</span>)}
                        </div>
                        <p className="mt-1.5 text-[10px] text-gray-400">
                          Erstellt {k.created_at.slice(0, 10)} · {k.last_used_at ? `Last used ${k.last_used_at.slice(0, 10)}` : 'noch nie benutzt'}
                        </p>
                      </div>
                      {k.active && (
                        <button onClick={() => revoke(k.id)} className="text-[10px] font-semibold text-red-500 hover:underline">
                          <Trash2 size={10} className="inline" /> Revoken
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Event-Stream Tab */}
      {tab === 'events' && (
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Letzte 20 Events</h2>
            <span className="text-[10px] text-gray-400">refresht beim Page-Reload</span>
          </div>
          {recentEvents.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-400">Noch keine Events.</p>
          ) : (
            <ul className="divide-y divide-gray-100 font-mono text-xs">
              {recentEvents.map(e => (
                <li key={e.id} className="px-6 py-3 flex items-center gap-3">
                  <span className="text-gray-400 w-16">{e.occurred_at.slice(11, 19)}</span>
                  <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-700 w-24 text-center">{e.category}</span>
                  <span className="flex-1">{e.type}</span>
                  <span className="text-gray-400 text-[10px]">{e.source}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-900'
      }`}>
      {icon} {children}
    </button>
  )
}
