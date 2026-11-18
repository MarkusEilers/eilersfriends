import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported for "Transaction" pool mode (Vercel Postgres)
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })

/**
 * Schutz für die Selbstheilung (18.11.2026).
 *
 * Viele Module rufen bei jedem Kaltstart `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
 * und `CREATE INDEX IF NOT EXISTS` auf. Auch wenn die Spalte längst existiert,
 * stellt Postgres dafür eine exklusive Sperre an. Hängt irgendwo eine lange
 * Abfrage auf derselben Tabelle, warten alle ALTERs — und hinter ihnen jede
 * normale Abfrage. So stand am 18.11. die ganze Website (blog_posts).
 *
 * Deshalb: Existiert die Spalte / der Index schon, wird der Befehl gar nicht
 * erst geschickt. Fehlt sie wirklich, läuft er mit lock_timeout von 3 s und
 * gibt lieber auf, als alles zu blockieren.
 */
const ADD_COLUMN = /^\s*ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?"?([\w.]+)"?\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+"?(\w+)"?/i
const CREATE_INDEX = /^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?IF\s+NOT\s+EXISTS\s+"?(\w+)"?/i
const known = new Set<string>()

async function exists(kind: 'col' | 'idx', a: string, b?: string): Promise<boolean> {
  const key = `${kind}:${a}:${b ?? ''}`
  if (known.has(key)) return true
  const table = a.includes('.') ? a.split('.').pop()! : a
  const r = kind === 'col'
    ? await client`SELECT 1 FROM information_schema.columns WHERE table_name = ${table} AND column_name = ${b!} LIMIT 1`
    : await client`SELECT 1 FROM pg_indexes WHERE indexname = ${a} LIMIT 1`
  if (r.length) known.add(key)
  return r.length > 0
}

const rawExecute = db.execute.bind(db)
db.execute = (async (query: Parameters<typeof rawExecute>[0]) => {
  let text = '', params = 0
  try {
    const q = typeof query === 'string' ? { sql: query, params: [] } : (db as unknown as { dialect: { sqlToQuery: (q: unknown) => { sql: string; params: unknown[] } } }).dialect.sqlToQuery(
      (query as { getSQL?: () => unknown }).getSQL ? (query as { getSQL: () => unknown }).getSQL() : query)
    text = q.sql; params = q.params.length
  } catch { /* kein Text ermittelbar → normal ausführen */ }
  // Mehrere ADD COLUMN in einem Befehl oder Parameter → wie bisher ausführen
  if (params || /ADD\s+COLUMN[\s\S]*ADD\s+COLUMN/i.test(text)) return rawExecute(query)
  const col = ADD_COLUMN.exec(text)
  const idx = col ? null : CREATE_INDEX.exec(text)
  if (col || idx) {
    try {
      if (col ? await exists('col', col[1], col[2]) : await exists('idx', idx![1])) return [] as unknown as Awaited<ReturnType<typeof rawExecute>>
    } catch { /* Prüfung fehlgeschlagen → unten mit Zeitlimit versuchen */ }
    const statement = text
    await client.begin(async (tx) => {
      await tx`SET LOCAL lock_timeout = '3s'`
      await tx.unsafe(statement)
    })
    return [] as unknown as Awaited<ReturnType<typeof rawExecute>>
  }
  return rawExecute(query)
}) as typeof db.execute
