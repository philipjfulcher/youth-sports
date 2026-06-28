import type { DatabaseConnection } from '@netlify/database'

export interface Meet {
  id: number
  name: string
  date: string
  location: string | null
  results_summary: string | null
}

export async function getAllMeets(db: DatabaseConnection): Promise<Meet[]> {
  return db.sql<Meet>`SELECT * FROM meets ORDER BY date DESC`
}
