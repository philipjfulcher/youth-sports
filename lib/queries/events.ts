import type { DatabaseConnection } from '@netlify/database'

export interface Event {
  id: number
  title: string
  description: string | null
  event_date: string
  location: string | null
  event_type: 'meet' | 'practice' | 'other'
  created_by: number | null
}

export async function getAllEvents(db: DatabaseConnection): Promise<Event[]> {
  return db.sql<Event>`SELECT * FROM events ORDER BY event_date ASC`
}

export async function getEventById(db: DatabaseConnection, id: number): Promise<Event | undefined> {
  const rows = await db.sql<Event>`SELECT * FROM events WHERE id = ${id} LIMIT 1`
  return rows[0]
}

export async function createEvent(
  db: DatabaseConnection,
  data: { title: string; description: string; eventDate: string; location: string; eventType: string; createdBy: number | null }
): Promise<number> {
  const rows = await db.sql<{ id: number }>`
    INSERT INTO events (title, description, event_date, location, event_type, created_by)
    VALUES (${data.title}, ${data.description}, ${data.eventDate}, ${data.location}, ${data.eventType}, ${data.createdBy})
    RETURNING id
  `
  return rows[0].id
}

export async function deleteEvent(db: DatabaseConnection, id: number): Promise<void> {
  await db.sql`DELETE FROM events WHERE id = ${id}`
}
