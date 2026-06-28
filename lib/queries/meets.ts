import { conn } from '../db';

export interface Meet {
  id: number
  name: string
  date: string
  location: string | null
  results_summary: string | null
}

export async function getAllMeets(): Promise<Meet[]> {
  const stmt = await conn.prepare('SELECT * FROM meets ORDER BY date DESC')
  return await stmt.all() as Meet[]
}
