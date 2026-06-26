import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface SessionData {
  userId?: number
  role?: 'swimmer' | 'coach'
  name?: string
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET ?? 'riverside-marlins-super-secret-key-change-in-prod-32chars',
  cookieName: 'marlins-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  if (!session.userId) redirect('/login')
  return session
}

export async function requireCoach(): Promise<SessionData> {
  const session = await getSession()
  if (!session.userId) redirect('/login')
  if (session.role !== 'coach') redirect('/dashboard')
  return session
}
