import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyApiKey, hasScope } from '@/lib/events/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * MCP-Endpoint — Model-Context-Protocol kompatibel.
 * Erlaubt Claude / Cowork / anderen AI-Tools, den Eilers+Friends-State zu lesen
 * (und später mit Bestätigung zu schreiben).
 *
 * Protocol: JSON-RPC 2.0 mit MCP-Methoden
 * - initialize
 * - tools/list  → Liste der verfügbaren Tools
 * - tools/call  → Tool-Aufruf
 *
 * Auth: Bearer-Token mit Scope 'mcp:read' (oder '*').
 * Schreibende Tools brauchen zusätzlich 'mcp:propose' und produzieren
 * Vorschlag-Records statt direkt zu schreiben (Wave 4 sukzessive Anbindung).
 */

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number
  method: string
  params?: Record<string, unknown>
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id?: string | number
  result?: unknown
  error?: { code: number; message: string }
}

const TOOLS = [
  {
    name: 'get_subscriber',
    description: 'Look up a subscriber by email — returns confirmation status, source, signup date.',
    inputSchema: {
      type: 'object',
      properties: { email: { type: 'string', description: 'Email address to look up' } },
      required: ['email'],
    },
  },
  {
    name: 'list_recent_events',
    description: 'List the most recent domain events. Filter by category or type prefix.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['subscriber','framework','offer','member','community','system'] },
        type: { type: 'string', description: 'Exact event type or prefix with .* (e.g. "offer.*")' },
        limit: { type: 'number', default: 20, maximum: 100 },
      },
    },
  },
  {
    name: 'list_recent_offers',
    description: 'List the most recent offers — title, customer, status, valid_until.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft','sent','viewed','signed','paid','expired','cancelled'] },
        limit: { type: 'number', default: 20, maximum: 100 },
      },
    },
  },
  {
    name: 'list_frameworks',
    description: 'List all frameworks with status and slug — useful to know what content exists.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_framework_stats',
    description: 'Get engagement stats for a framework (subscribers via DOI, events triggered).',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
]

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === 'get_subscriber') {
    const email = String(args.email || '').trim().toLowerCase()
    if (!email) throw new Error('email required')
    const rows = await db.execute(sql`
      SELECT email, first_name, source, confirmed, confirmed_at::text as confirmed_at, created_at::text as created_at
      FROM subscribers WHERE LOWER(email) = ${email} LIMIT 1
    `)
    const arr = rows as unknown as unknown[]
    return arr[0] ?? null
  }

  if (name === 'list_recent_events') {
    const limit = Math.min(Number(args.limit ?? 20), 100)
    const category = args.category ? String(args.category) : null
    const typeFilter = args.type ? String(args.type) : null
    const conditions: ReturnType<typeof sql>[] = []
    if (category) conditions.push(sql`category = ${category}::event_category`)
    if (typeFilter) {
      if (typeFilter.endsWith('.*')) conditions.push(sql`type LIKE ${typeFilter.slice(0,-1) + '%'}`)
      else conditions.push(sql`type = ${typeFilter}`)
    }
    const where = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``
    const rows = await db.execute(sql`
      SELECT id, category, type, payload, source, occurred_at::text as occurred_at
      FROM events ${where}
      ORDER BY occurred_at DESC LIMIT ${limit}
    `)
    return rows
  }

  if (name === 'list_recent_offers') {
    const limit = Math.min(Number(args.limit ?? 20), 100)
    const status = args.status ? String(args.status) : null
    const where = status ? sql`WHERE status = ${status}::offer_status` : sql``
    const rows = await db.execute(sql`
      SELECT id, offer_number, customer_name, customer_company, title, status,
             valid_until::text as valid_until, created_at::text as created_at
      FROM offers ${where}
      ORDER BY created_at DESC LIMIT ${limit}
    `)
    return rows
  }

  if (name === 'list_frameworks') {
    const rows = await db.execute(sql`
      SELECT id, slug, title, status, locale, accent_color, updated_at::text as updated_at
      FROM landing_pages
      WHERE template_key = 'framework-leadmagnet'
      ORDER BY updated_at DESC
    `)
    return rows
  }

  if (name === 'get_framework_stats') {
    const slug = String(args.slug || '').trim()
    if (!slug) throw new Error('slug required')
    const subs = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text as count FROM subscribers WHERE source = ${'framework-' + slug} AND confirmed = true
    `)
    const events = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text as count FROM events WHERE framework_slug = ${slug}
    `)
    const arr1 = subs as unknown as { count: string }[]
    const arr2 = events as unknown as { count: string }[]
    return {
      slug,
      confirmed_subscribers: parseInt(arr1[0]?.count ?? '0', 10),
      events_triggered: parseInt(arr2[0]?.count ?? '0', 10),
    }
  }

  throw new Error(`unknown_tool:${name}`)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ctx = await verifyApiKey(req.headers.get('authorization'))
  if (!ctx) return NextResponse.json({ jsonrpc: '2.0', error: { code: -32001, message: 'unauthorized' } } as JsonRpcResponse, { status: 401 })
  if (!hasScope(ctx, 'mcp:read')) return NextResponse.json({ jsonrpc: '2.0', error: { code: -32002, message: 'forbidden' } } as JsonRpcResponse, { status: 403 })

  let body: JsonRpcRequest
  try { body = await req.json() } catch {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32700, message: 'parse_error' } } as JsonRpcResponse, { status: 400 })
  }

  const id = body.id

  if (body.method === 'initialize') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'eilersfriends-mcp', version: '1.0.0' },
      },
    } as JsonRpcResponse)
  }

  if (body.method === 'tools/list') {
    return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } } as JsonRpcResponse)
  }

  if (body.method === 'tools/call') {
    const params = body.params as { name: string; arguments?: Record<string, unknown> } | undefined
    if (!params?.name) {
      return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'name_required' } } as JsonRpcResponse, { status: 400 })
    }
    try {
      const result = await callTool(params.name, params.arguments ?? {})
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
      } as JsonRpcResponse)
    } catch (err) {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err instanceof Error ? err.message : 'tool_failed' },
      } as JsonRpcResponse, { status: 500 })
    }
  }

  return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `method_not_found:${body.method}` } } as JsonRpcResponse, { status: 404 })
}
