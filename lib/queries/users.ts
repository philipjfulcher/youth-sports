import type Database from 'better-sqlite3'

export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  role: 'swimmer' | 'coach'
  created_at: string
}

export function getUserByEmail(db: Database.Database, email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined
}

export function createUser(
  db: Database.Database,
  data: { name: string; email: string; passwordHash: string; role: 'swimmer' | 'coach' }
): number {
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(data.name, data.email, data.passwordHash, data.role)
  return result.lastInsertRowid as number
}
