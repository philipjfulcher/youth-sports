import type Database from 'better-sqlite3'

export interface Record {
  id: number
  swimmer_id: number
  stroke: string
  distance: number
  time_seconds: number
  recorded_at: string
  name?: string
}

export function getTeamRecords(db: Database.Database): Record[] {
  return db.prepare(`
    SELECT r.*, u.name
    FROM records r
    JOIN swimmers s ON s.id = r.swimmer_id
    JOIN users u ON u.id = s.user_id
    ORDER BY r.stroke, r.distance, r.time_seconds ASC
  `).all() as Record[]
}

export function getRecordsForSwimmer(db: Database.Database, swimmerId: number): Record[] {
  return db.prepare('SELECT * FROM records WHERE swimmer_id = ? ORDER BY stroke, distance').all(swimmerId) as Record[]
}
