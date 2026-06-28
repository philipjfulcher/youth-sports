import type Database from 'better-sqlite3'

export interface Meet {
  id: number
  name: string
  date: string
  location: string | null
  results_summary: string | null
}

export function getAllMeets(db: Database.Database): Meet[] {
  return db.prepare('SELECT * FROM meets ORDER BY date DESC').all() as Meet[]
}
