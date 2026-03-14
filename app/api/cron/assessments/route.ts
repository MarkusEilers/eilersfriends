import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Query enrollments where next_assessment_at <= now
  // Create Assessment records and send reminder emails

  return NextResponse.json({
    success: true,
    message: 'Assessment cron triggered',
    timestamp: new Date().toISOString(),
  })
}
