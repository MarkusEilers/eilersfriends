import { handleAssistantMcp, methodNotAllowed } from '@/lib/assistant/mcp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Key in the path, for connectors that cannot send an Authorization header. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return handleAssistantMcp(req, token)
}
export async function GET() { return methodNotAllowed() }
export async function DELETE() { return methodNotAllowed() }
