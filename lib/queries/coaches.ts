import type { DatabaseConnection } from '@netlify/database'

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

export async function getAllCoaches(db: DatabaseConnection): Promise<CoachWithUser[]> {
  return db.sql<CoachWithUser>`
    SELECT c.*, u.name, u.email
    FROM coaches c
    JOIN users u ON u.id = c.user_id
    ORDER BY u.name
  `
}

export async function getCoachByUserId(db: DatabaseConnection, userId: number): Promise<Coach | undefined> {
  const rows = await db.sql<Coach>`SELECT * FROM coaches WHERE user_id = ${userId} LIMIT 1`
  return rows[0]
}
