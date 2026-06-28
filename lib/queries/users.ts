import { conn } from '../db';

export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  role: 'swimmer' | 'coach'
  created_at: string
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const stmt = await conn.prepare('SELECT * FROM users WHERE email = ?')
  return await stmt.get(email) as User | undefined
}

export async function createUser(
  data: { name: string; email: string; passwordHash: string; role: 'swimmer' | 'coach' }
): Promise<number> {
  const stmt = await conn.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
  const result = await stmt.run([data.name, data.email, data.passwordHash, data.role])
  return result.lastInsertRowid as number
}
