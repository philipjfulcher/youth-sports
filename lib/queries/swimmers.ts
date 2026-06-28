import { conn } from '../db';

export interface Swimmer {
  id: number
  user_id: number
  age: number | null
  stroke_specialty: string | null
  joined_at: string
}

export interface SwimmerWithUser extends Swimmer {
  name: string
  email: string
}

export async function createSwimmer(
  data: { userId: number; age: number | null; strokeSpecialty: string | null }
): Promise<number> {
  const stmt = await conn.prepare('INSERT INTO swimmers (user_id, age, stroke_specialty) VALUES (?, ?, ?)')
  const result = await stmt.run([data.userId, data.age, data.strokeSpecialty])
  return result.lastInsertRowid as number
}

export async function getSwimmerByUserId(userId: number): Promise<Swimmer | undefined> {
  const stmt = await conn.prepare('SELECT * FROM swimmers WHERE user_id = ?')
  return await stmt.get(userId) as Swimmer | undefined
}

export async function getAllSwimmers(): Promise<SwimmerWithUser[]> {
  const stmt = await conn.prepare(`
    SELECT s.*, u.name, u.email
    FROM swimmers s
    JOIN users u ON u.id = s.user_id
    ORDER BY u.name
  `)
  return await stmt.all() as SwimmerWithUser[]
}
