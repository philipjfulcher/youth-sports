import { conn } from '../db';

export interface Event {
  id: number
  title: string
  description: string | null
  event_date: string
  location: string | null
  event_type: 'meet' | 'practice' | 'other'
  created_by: number | null
}

export async function getAllEvents(): Promise<Event[]> {
  const stmt = await conn.prepare('SELECT * FROM events ORDER BY event_date ASC')
  return await stmt.all() as Event[]
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const stmt = await conn.prepare('SELECT * FROM events WHERE id = ?')
  return await stmt.get(id) as Event | undefined
}

export async function createEvent(
  data: { title: string; description: string; eventDate: string; location: string; eventType: string; createdBy: number | null }
): Promise<number> {
  const stmt = await conn.prepare(
    'INSERT INTO events (title, description, event_date, location, event_type, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const result = await stmt.run([data.title, data.description, data.eventDate, data.location, data.eventType, data.createdBy])
  return result.lastInsertRowid as number
}

export async function deleteEvent(id: number): Promise<void> {
  const stmt = await conn.prepare('DELETE FROM events WHERE id = ?')
  await stmt.run(id)
}
