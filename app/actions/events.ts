'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { createEvent, deleteEvent } from '@/lib/queries/events'
import { signUpForEvent, withdrawFromEvent } from '@/lib/queries/signups'
import { requireAuth, requireCoach } from '@/lib/session'
import { pendoTrack } from '@/lib/pendo'

export async function signUp(eventId: number) {
  const session = await requireAuth()
  if (session.role === 'coach') return
  const db = getDb()
  signUpForEvent(db, eventId, session.userId!)

  await pendoTrack('event_signup', session.userId!, {
    event_id: eventId,
  })

  revalidatePath('/events')
  revalidatePath('/dashboard')
}

export async function withdraw(eventId: number) {
  const session = await requireAuth()
  if (session.role === 'coach') return
  const db = getDb()
  withdrawFromEvent(db, eventId, session.userId!)

  await pendoTrack('event_withdrawal', session.userId!, {
    event_id: eventId,
  })

  revalidatePath('/events')
  revalidatePath('/dashboard')
}

export async function createNewEvent(formData: FormData) {
  const session = await requireCoach()
  const db = getDb()
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const eventType = formData.get('eventType') as string
  createEvent(db, {
    title: formData.get('title') as string,
    description,
    eventDate: formData.get('eventDate') as string,
    location,
    eventType,
    createdBy: session.userId!,
  })

  await pendoTrack('event_created', session.userId!, {
    event_type: eventType,
    has_description: !!description,
    has_location: !!location,
  })

  redirect('/events')
}

export async function removeEvent(eventId: number) {
  const session = await requireCoach()
  const db = getDb()
  deleteEvent(db, eventId)

  await pendoTrack('event_deleted', session.userId!, {
    event_id: eventId,
  })

  revalidatePath('/events')
}
