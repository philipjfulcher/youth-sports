import type Database from 'better-sqlite3'

export interface Coach {
  id: number
  user_id: number
  bio: string | null
  years_experience: number | null
}

export interface CoachWithUser extends Coach {
  name: string
  email: string
}

export function getAllCoaches(db: Database.Database): CoachWithUser[] {
  return db.prepare(`
    SELECT c.*, u.name, u.email
    FROM coaches c
    JOIN users u ON u.id = c.user_id
    ORDER BY u.name
  `).all() as CoachWithUser[]
}

export function getCoachByUserId(db: Database.Database, userId: number): Coach | undefined {
  return db.prepare('SELECT * FROM coaches WHERE user_id = ?').get(userId) as Coach | undefined
}
