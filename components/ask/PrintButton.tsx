'use client'
export function PrintButton({ label, className = 'btn glass' }: { label: string; className?: string }) {
  return <button className={`${className} no-print`} onClick={() => window.print()}>{label}</button>
}
