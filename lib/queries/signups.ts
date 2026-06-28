import { conn } from '../db';

export interface EventSignup {
  id: number
  event_id: number
  user_id: number
  signed_up_at: string
}

export async function getSignupsForUser(userId: number): Promise<EventSignup[]> {
  const stmt = await conn.prepare('SELECT * FROM event_signups WHERE user_id = ?')
  return await stmt.all(userId) as EventSignup[]
}

export async function isSignedUp(eventId: number, userId: number): Promise<boolean> {
  const stmt = await conn.prepare('SELECT id FROM event_signups WHERE event_id = ? AND user_id = ?')
  const row = await stmt.get([eventId, userId])
  return row !== undefined
}

export async function signUpForEvent(eventId: number, userId: number): Promise<void> {
  const stmt = await conn.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)')
  await stmt.run([eventId, userId])
}

export async function withdrawFromEvent(eventId: number, userId: number): Promise<void> {
  const stmt = await conn.prepare('DELETE FROM event_signups WHERE event_id = ? AND user_id = ?')
  await stmt.run([eventId, userId])
}
