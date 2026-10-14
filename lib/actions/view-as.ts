'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { VIEW_AS_COOKIE } from '@/lib/view-as'

async function requireEf() {
  const s = await auth()
  if (s?.user?.role !== 'admin' && s?.user?.role !== 'coach') throw new Error('unauthorized')
}

/** value: JSON {companyId, userId?, teamKey?, label?} oder leer = beenden */
export async function setViewAs(fd: FormData) {
  await requireEf()
  const v = fd.get('value')?.toString() ?? ''
  const jar = await cookies()
  if (!v) jar.delete(VIEW_AS_COOKIE)
  else jar.set(VIEW_AS_COOKIE, v, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 8 })
  redirect((fd.get('next')?.toString() || '/dashboard/guide') as '/')
}
