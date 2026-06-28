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
  const rows = await db.sql<{ id: number; name: string; email: string; role: string; created_at: string }>`
    SELECT id, name, email, role, created_at FROM users WHERE id = ${session.userId} LIMIT 1
  `
  const user = rows[0]

  if (!user) return null

  let age: number | null = null
  let strokeSpecialty: string | null = null
  let joinedAt: string | null = null
  let yearsExperience: number | null = null

  if (user.role === 'swimmer') {
    const swimmer = await getSwimmerByUserId(db, user.id)
    if (swimmer) {
      age = swimmer.age
      strokeSpecialty = swimmer.stroke_specialty
      joinedAt = swimmer.joined_at
    }
  } else if (user.role === 'coach') {
    const coach = await getCoachByUserId(db, user.id)
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

const PENDO_TRACK_URL = 'https://data.pendo.io/data/track'
const PENDO_INTEGRATION_KEY = '7503c67b-8e34-45b8-8b92-85ba9d751187'

export async function pendoTrack(
  event: string,
  visitorId: string | number,
  properties?: Record<string, string | number | boolean>
) {
  try {
    await fetch(PENDO_TRACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pendo-integration-key': PENDO_INTEGRATION_KEY,
      },
      body: JSON.stringify({
        type: 'track',
        event,
        visitorId: String(visitorId),
        accountId: 'system',
        timestamp: Date.now(),
        properties: properties ?? {},
      }),
    })
  } catch (e) {
    console.error('Pendo track event failed:', e)
  }
}
