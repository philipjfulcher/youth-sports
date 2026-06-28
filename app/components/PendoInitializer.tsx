'use client'

import { useEffect, useRef } from 'react'
import type { PendoVisitorData } from '@/lib/pendo'

export function PendoInitializer({ visitorData }: { visitorData: PendoVisitorData | null }) {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      pendo.initialize({ visitor: { id: '' } })
    }

    if (visitorData) {
      pendo.identify({
        visitor: {
          id: visitorData.id,
          email: visitorData.email,
          full_name: visitorData.name,
          role: visitorData.role,
          createdAt: visitorData.createdAt,
          age: visitorData.age,
          strokeSpecialty: visitorData.strokeSpecialty,
          joinedAt: visitorData.joinedAt,
          yearsExperience: visitorData.yearsExperience,
        }
      })
    }
  }, [visitorData])

  return null
}
