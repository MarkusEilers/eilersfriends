import { NextRequest } from 'next/server'

// Server-zu-Server-Auth für den Telefonie-/Voice-Server (Shared Secret)
export function voiceAuthorized(req: NextRequest): boolean {
  const key = process.env.VOICE_API_KEY
  if (!key) return false
  const provided = req.headers.get('x-api-key') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return !!provided && provided === key
}

// Durchwahl → Person (Plan: DW 4–7)
export const DW_PERSONS: Record<number, string> = { 4: 'daniel', 5: 'aljona', 6: 'cosima', 7: 'markus' }
export function personForKey(key: string): string {
  const n = Number(key)
  if (!Number.isNaN(n) && DW_PERSONS[n]) return DW_PERSONS[n]
  return key // bereits ein Slug
}
