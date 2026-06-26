import type Database from 'better-sqlite3'

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

export function createSwimmer(
  db: Database.Database,
  data: { userId: number; age: number | null; strokeSpecialty: string | null }
): number {
  const result = db
    .prepare('INSERT INTO swimmers (user_id, age, stroke_specialty) VALUES (?, ?, ?)')
    .run(data.userId, data.age, data.strokeSpecialty)
  return result.lastInsertRowid as number
}

export function getSwimmerByUserId(db: Database.Database, userId: number): Swimmer | undefined {
  return db.prepare('SELECT * FROM swimmers WHERE user_id = ?').get(userId) as Swimmer | undefined
}

export function getAllSwimmers(db: Database.Database): SwimmerWithUser[] {
  return db.prepare(`
    SELECT s.*, u.name, u.email
    FROM swimmers s
    JOIN users u ON u.id = s.user_id
    ORDER BY u.name
  `).all() as SwimmerWithUser[]
}
