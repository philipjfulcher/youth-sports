import type { DatabaseConnection } from '@netlify/database'

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
  db: DatabaseConnection,
  data: { userId: number; age: number | null; strokeSpecialty: string | null }
): Promise<number> {
  const rows = await db.sql<{ id: number }>`
    INSERT INTO swimmers (user_id, age, stroke_specialty)
    VALUES (${data.userId}, ${data.age}, ${data.strokeSpecialty})
    RETURNING id
  `
  return rows[0].id
}

export async function getSwimmerByUserId(db: DatabaseConnection, userId: number): Promise<Swimmer | undefined> {
  const rows = await db.sql<Swimmer>`SELECT * FROM swimmers WHERE user_id = ${userId} LIMIT 1`
  return rows[0]
}

export async function getAllSwimmers(db: DatabaseConnection): Promise<SwimmerWithUser[]> {
  return db.sql<SwimmerWithUser>`
    SELECT s.*, u.name, u.email
    FROM swimmers s
    JOIN users u ON u.id = s.user_id
    ORDER BY u.name
  `
}
