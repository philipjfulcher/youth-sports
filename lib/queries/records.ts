import { conn } from '../db';

export interface Record {
  id: number
  swimmer_id: number
  stroke: string
  distance: number
  time_seconds: number
  recorded_at: string
  name?: string
}

export async function getTeamRecords(): Promise<Record[]> {
  const stmt = await conn.prepare(`
    SELECT r.*, u.name
    FROM records r
    JOIN swimmers s ON s.id = r.swimmer_id
    JOIN users u ON u.id = s.user_id
    ORDER BY r.stroke, r.distance, r.time_seconds ASC
  `)
  return await stmt.all() as Record[]
}

export async function getRecordsForSwimmer(swimmerId: number): Promise<Record[]> {
  const stmt = await conn.prepare('SELECT * FROM records WHERE swimmer_id = ? ORDER BY stroke, distance')
  return await stmt.all(swimmerId) as Record[]
}
