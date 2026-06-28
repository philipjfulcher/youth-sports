import type { DatabaseConnection } from '@netlify/database'

export interface Record {
  id: number
  swimmer_id: number
  stroke: string
  distance: number
  time_seconds: number
  recorded_at: string
  name?: string
}

export async function getTeamRecords(db: DatabaseConnection): Promise<Record[]> {
  return db.sql<Record>`
    SELECT r.*, u.name
    FROM records r
    JOIN swimmers s ON s.id = r.swimmer_id
    JOIN users u ON u.id = s.user_id
    ORDER BY r.stroke, r.distance, r.time_seconds ASC
  `
}

export async function getRecordsForSwimmer(db: DatabaseConnection, swimmerId: number): Promise<Record[]> {
  return db.sql<Record>`SELECT * FROM records WHERE swimmer_id = ${swimmerId} ORDER BY stroke, distance`
}
