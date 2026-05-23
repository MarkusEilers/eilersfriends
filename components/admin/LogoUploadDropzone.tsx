'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface LogoUploadDropzoneProps {
  /** When editing an existing logo, pre-fill these values */
  initialSlug?: string
  initialName?: string
  initialDomain?: string | null
  initialOrder?: number
  /** Optional callback once upload completes successfully */
  onSuccess?: (result: { src: string; srcBw: string | null; slug: string }) => void
  /** Show name + domain + order fields (true) or just file picker (false, for inline edit row) */
  compact?: boolean
}

type Status =
  | { phase: 'idle' }
  | { phase: 'uploading'; progress: number }
  | { phase: 'success'; src: string; srcBw: string | null }
  | { phase: 'error'; message: string }

export function LogoUploadDropzone(props: LogoUploadDropzoneProps) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>({ phase: 'idle' })
  const [name, setName] = useState(props.initialName ?? '')
  const [domain, setDomain] = useState(props.initialDomain ?? '')
  const [order, setOrder] = useState(props.initialOrder ?? 99)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name || file.name.replace(/\.[^.]+$/, ''))
    if (props.initialSlug) fd.append('slug', props.initialSlug)
    if (domain) fd.append('domain', domain)
    fd.append('order', String(order))
    fd.append('isVisible', 'true')

    setStatus({ phase: 'uploading', progress: 0 })

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/logos/upload')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100)
        setStatus({ phase: 'uploading', progress: pct })
      }
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && res.ok) {
          setStatus({ phase: 'success', src: res.src, srcBw: res.srcBw })
          props.onSuccess?.(res)
          router.refresh()
        } else {
          const msg = res.detail || res.error || `HTTP ${xhr.status}`
          setStatus({ phase: 'error', message: msg })
        }
      } catch (err) {
        setStatus({ phase: 'error', message: `parse_error: ${xhr.status} ${xhr.responseText.slice(0, 200)}` })
      }
    }
    xhr.onerror = () => setStatus({ phase: 'error', message: 'Netzwerk-Fehler' })
    xhr.send(fd)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      {!props.compact && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-5">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. TechCrunch"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-5">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Domain</label>
            <input
              value={domain ?? ''}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="techcrunch.com"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value || '0', 10))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-center"
            />
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-5 transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
        }`}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp,image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-3 text-sm">
          {status.phase === 'idle' && (
            <>
              <UploadCloud size={18} className="text-gray-400" />
              <span className="text-gray-600">
                Datei hierher ziehen oder klicken — PNG / JPG / SVG / WEBP
              </span>
            </>
          )}
          {status.phase === 'uploading' && (
            <>
              <Loader2 size={18} className="text-blue-600 animate-spin" />
              <span className="text-blue-700">Lade hoch · {status.progress}%</span>
            </>
          )}
          {status.phase === 'success' && (
            <>
              <CheckCircle2 size={18} className="text-green-600" />
              <span className="text-green-700">Gespeichert. {status.srcBw ? 'Farbe + BW gespeichert.' : 'Farbe gespeichert. (SVG: BW via CSS)'}</span>
            </>
          )}
          {status.phase === 'error' && (
            <>
              <XCircle size={18} className="text-red-600" />
              <span className="text-red-700">Fehler: {status.message}</span>
            </>
          )}
        </div>

        {status.phase === 'uploading' && (
          <div className="mt-3 h-1.5 w-full rounded-full bg-blue-100">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        )}
      </div>

      {status.phase === 'success' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-gray-400">Farbe</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={status.src} alt="color" className="h-10 w-auto object-contain" />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-gray-400">BW</p>
            {status.srcBw ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={status.srcBw} alt="bw" className="h-10 w-auto object-contain" />
            ) : (
              <span className="text-[10px] text-gray-400">SVG · CSS-Grayscale</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
