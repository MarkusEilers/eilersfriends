import { handleAssistantMcp, methodNotAllowed } from '@/lib/assistant/mcp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) { return handleAssistantMcp(req, null) }
export async function GET() { return methodNotAllowed() }
export async function DELETE() { return methodNotAllowed() }
