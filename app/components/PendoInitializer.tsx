'use client'

import { useEffect, useRef } from 'react'
import type { PendoVisitorData } from '@/lib/pendo'

function getAnonId(): string {
  let anonId = localStorage.getItem('pendo_anon_id')
  if (!anonId) {
    anonId = 'anon-' + crypto.randomUUID()
    localStorage.setItem('pendo_anon_id', anonId)
  }
  return anonId
}

function buildVisitor(visitorData: PendoVisitorData) {
  return {
    id: String(visitorData.id),
    email: visitorData.email,
    full_name: visitorData.name,
    role: visitorData.role,
    createdAt: visitorData.createdAt,
    age: visitorData.age,
    strokeSpecialty: visitorData.strokeSpecialty,
    joinedAt: visitorData.joinedAt,
    yearsExperience: visitorData.yearsExperience,
  }
}

export function PendoInitializer({ visitorData }: { visitorData: PendoVisitorData | null }) {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      pendo.initialize({
        visitor: visitorData ? buildVisitor(visitorData) : { id: getAnonId() },
      })
    } else if (visitorData) {
      pendo.identify({ visitor: buildVisitor(visitorData) })
    }
  }, [visitorData])

  return null
}
