import type Database from 'better-sqlite3'

export interface EventSignup {
  id: number
  event_id: number
  user_id: number
  signed_up_at: string
}

export function getSignupsForUser(db: Database.Database, userId: number): EventSignup[] {
  return db.prepare('SELECT * FROM event_signups WHERE user_id = ?').all(userId) as EventSignup[]
}

export function isSignedUp(db: Database.Database, eventId: number, userId: number): boolean {
  const row = db.prepare('SELECT id FROM event_signups WHERE event_id = ? AND user_id = ?').get(eventId, userId)
  return row !== undefined
}

export function signUpForEvent(db: Database.Database, eventId: number, userId: number): void {
  db.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventId, userId)
}

export function withdrawFromEvent(db: Database.Database, eventId: number, userId: number): void {
  db.prepare('DELETE FROM event_signups WHERE event_id = ? AND user_id = ?').run(eventId, userId)
}
