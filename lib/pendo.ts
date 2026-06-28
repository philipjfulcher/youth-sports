import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { getSwimmerByUserId } from '@/lib/queries/swimmers'
import { getCoachByUserId } from '@/lib/queries/coaches'

export interface PendoVisitorData {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
  age: number | null
  strokeSpecialty: string | null
  joinedAt: string | null
  yearsExperience: number | null
}

export async function getPendoVisitorData(): Promise<PendoVisitorData | null> {
  const session = await getSession()
  if (!session.userId) return null

  const db = getDb()
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(session.userId) as {
    id: number
    name: string
    email: string
    role: string
    created_at: string
  } | undefined

  if (!user) return null

  let age: number | null = null
  let strokeSpecialty: string | null = null
  let joinedAt: string | null = null
  let yearsExperience: number | null = null

  if (user.role === 'swimmer') {
    const swimmer = getSwimmerByUserId(db, user.id)
    if (swimmer) {
      age = swimmer.age
      strokeSpecialty = swimmer.stroke_specialty
      joinedAt = swimmer.joined_at
    }
  } else if (user.role === 'coach') {
    const coach = getCoachByUserId(db, user.id)
    if (coach) {
      yearsExperience = coach.years_experience
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
    age,
    strokeSpecialty,
    joinedAt,
    yearsExperience,
  }
}
