import type { DatabaseConnection } from '@netlify/database'

export interface EventSignup {
  id: number
  event_id: number
  user_id: number
  signed_up_at: string
}

export async function getSignupsForUser(db: DatabaseConnection, userId: number): Promise<EventSignup[]> {
  return db.sql<EventSignup>`SELECT * FROM event_signups WHERE user_id = ${userId}`
}

export async function isSignedUp(db: DatabaseConnection, eventId: number, userId: number): Promise<boolean> {
  const rows = await db.sql<{ id: number }>`
    SELECT id FROM event_signups WHERE event_id = ${eventId} AND user_id = ${userId} LIMIT 1
  `
  return rows.length > 0
}

export async function signUpForEvent(db: DatabaseConnection, eventId: number, userId: number): Promise<void> {
  await db.sql`
    INSERT INTO event_signups (event_id, user_id) VALUES (${eventId}, ${userId})
    ON CONFLICT DO NOTHING
  `
}

export async function withdrawFromEvent(db: DatabaseConnection, eventId: number, userId: number): Promise<void> {
  await db.sql`DELETE FROM event_signups WHERE event_id = ${eventId} AND user_id = ${userId}`
}
