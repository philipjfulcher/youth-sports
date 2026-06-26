'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { createEvent, deleteEvent } from '@/lib/queries/events'
import { signUpForEvent, withdrawFromEvent } from '@/lib/queries/signups'
import { requireAuth, requireCoach } from '@/lib/session'

export async function signUp(eventId: number) {
  const session = await requireAuth()
  if (session.role === 'coach') return
  const db = getDb()
  signUpForEvent(db, eventId, session.userId!)
  revalidatePath('/events')
  revalidatePath('/dashboard')
}

export async function withdraw(eventId: number) {
  const session = await requireAuth()
  if (session.role === 'coach') return
  const db = getDb()
  withdrawFromEvent(db, eventId, session.userId!)
  revalidatePath('/events')
  revalidatePath('/dashboard')
}

export async function createNewEvent(formData: FormData) {
  const session = await requireCoach()
  const db = getDb()
  createEvent(db, {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    eventDate: formData.get('eventDate') as string,
    location: formData.get('location') as string,
    eventType: formData.get('eventType') as string,
    createdBy: session.userId!,
  })
  redirect('/events')
}

export async function removeEvent(eventId: number) {
  await requireCoach()
  const db = getDb()
  deleteEvent(db, eventId)
  revalidatePath('/events')
}
