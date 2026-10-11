import { inviteInfo } from '@/lib/org/invite'
import { InviteForm } from './InviteForm'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const info = await inviteInfo(token)
  const state = !info ? 'invalid' : info.used ? 'used' : info.expired ? 'expired' : 'ok'
  return (
    <InviteForm
      token={token}
      state={state}
      firstName={info?.name?.split(/\s+/)[0] ?? ''}
      email={info?.email ?? ''}
      lang={info?.locale === 'de' ? 'de' : 'en'}
    />
  )
}
