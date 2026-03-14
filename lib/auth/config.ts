import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPortal = nextUrl.pathname.includes('/portal') ||
        nextUrl.pathname.includes('/dashboard') ||
        nextUrl.pathname.includes('/assessment') ||
        nextUrl.pathname.includes('/zertifikate')
      const isAdmin = nextUrl.pathname.includes('/admin')

      if (isPortal || isAdmin) {
        if (!isLoggedIn) return false
        if (isAdmin && auth?.user?.role !== 'admin' && auth?.user?.role !== 'coach') return false
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1)

        if (!user || !user.passwordHash) return null

        const passwordValid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!passwordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        }
      },
    }),
  ],
}
