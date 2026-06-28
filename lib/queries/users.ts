import type { DatabaseConnection } from '@netlify/database'

export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  role: 'swimmer' | 'coach'
  created_at: string
}

export async function getUserByEmail(db: DatabaseConnection, email: string): Promise<User | undefined> {
  const rows = await db.sql<User>`SELECT * FROM users WHERE email = ${email} LIMIT 1`
  return rows[0]
}

export async function createUser(
  db: DatabaseConnection,
  data: { name: string; email: string; passwordHash: string; role: 'swimmer' | 'coach' }
): Promise<number> {
  const rows = await db.sql<{ id: number }>`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${data.name}, ${data.email}, ${data.passwordHash}, ${data.role})
    RETURNING id
  `
  return rows[0].id
}
