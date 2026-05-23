'use client'

import { useState, useRef, useEffect } from 'react'
import { UploadCloud, X, Loader2 } from 'lucide-react'

interface Props {
  offerId: string
  initialUrl?: string | null
  onUploaded?: (url: string) => void
}

/**
 * Customer-Logo-Upload — Drag&Drop / Click → POST /api/admin/offers/<id>/customer-logo
 * - Sofortiger Preview
 * - Progress-Bar (XHR-Upload)
 * - Reset-Button entfernt das Logo (setzt URL auf null via dedicated DELETE/null update)
 */
export function CustomerLogoUpload({ offerId, initialUrl, onUploaded }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null)
  const [pct, setPct] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUrl(initialUrl ?? null)
  }, [initialUrl])

  function uploadFile(file: File) {
    setErr(null)
    setBusy(true)
    setPct(0)
    const fd = new FormData()
    fd.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/admin/offers/${offerId}/customer-logo`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      setBusy(false); setPct(0)
      try {
        const res = JSON.parse(xhr.responseText) as { ok: boolean; url?: string; error?: string; detail?: string }
        if (res.ok && res.url) {
          setUrl(res.url)
          onUploaded?.(res.url)
        } else {
          setErr(res.error || 'upload_failed')
        }
      } catch { setErr('parse_failed') }
    }
    xhr.onerror = () => { setBusy(false); setErr('network_error') }
    xhr.send(fd)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation()
    const f = e.dataTransfer.files?.[0]
    if (f) uploadFile(f)
  }

  return (
    <div className="space-y-2">
      {url ? (
        <div className="relative inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Customer Logo" className="h-10 w-auto max-w-[140px] object-contain" />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="text-xs font-semibold text-blue-600 underline hover:text-blue-800"
          >
            Ersetzen
          </button>
          <button
            type="button"
            onClick={() => { setUrl(null); onUploaded?.('') }}
            className="text-xs text-gray-400 hover:text-red-600"
            title="Logo entfernen"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault() }}
          onDrop={onDrop}
          onClick={() => fileInput.current?.click()}
          className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-3 hover:border-blue-400 hover:bg-blue-50/50"
        >
          {busy ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <UploadCloud size={18} className="text-gray-400" />}
          <div className="flex-1 text-xs">
            <p className="font-semibold text-gray-700">
              {busy ? `Lade hoch… ${pct}%` : 'Logo hochladen / Drag&Drop'}
            </p>
            <p className="text-gray-400">PNG / SVG / JPG · wird in BW konvertiert</p>
          </div>
        </div>
      )}
      {busy && pct > 0 && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
      />
    </div>
  )
}
