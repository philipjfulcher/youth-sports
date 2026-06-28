import { conn } from '../db';

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

export async function getAllCoaches(): Promise<CoachWithUser[]> {
  const stmt = await conn.prepare(`
    SELECT c.*, u.name, u.email
    FROM coaches c
    JOIN users u ON u.id = c.user_id
    ORDER BY u.name
  `);

  return await stmt.all() as CoachWithUser[]
}

export async function getCoachByUserId(userId: number): Promise<Coach | undefined> {
  const stmt = await conn.prepare('SELECT * FROM coaches WHERE user_id = ?')

  return await stmt.get(userId) as Coach | undefined
}
