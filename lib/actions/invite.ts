'use server'

import { acceptInvite } from '@/lib/org/invite'

export async function acceptInviteAction(token: string, password: string) {
  return acceptInvite(token, password)
}
