import type Database from 'better-sqlite3'

export interface Event {
  id: number
  title: string
  description: string | null
  event_date: string
  location: string | null
  event_type: 'meet' | 'practice' | 'other'
  created_by: number | null
}

export function getAllEvents(db: Database.Database): Event[] {
  return db.prepare('SELECT * FROM events ORDER BY event_date ASC').all() as Event[]
}

export function getEventById(db: Database.Database, id: number): Event | undefined {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined
}

export function createEvent(
  db: Database.Database,
  data: { title: string; description: string; eventDate: string; location: string; eventType: string; createdBy: number | null }
): number {
  const result = db
    .prepare('INSERT INTO events (title, description, event_date, location, event_type, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(data.title, data.description, data.eventDate, data.location, data.eventType, data.createdBy)
  return result.lastInsertRowid as number
}

export function deleteEvent(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM events WHERE id = ?').run(id)
}
