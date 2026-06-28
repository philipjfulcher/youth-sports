'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { getUserByEmail, createUser } from '@/lib/queries/users'
import { createSwimmer } from '@/lib/queries/swimmers'
import { getSession } from '@/lib/session'

export async function login(_prevState: { error: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const db = getDb()
  const user = getUserByEmail(db, email)
  if (!user) return { error: 'Invalid email or password' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return { error: 'Invalid email or password' }

  const session = await getSession()
  session.userId = user.id
  session.role = user.role
  session.name = user.name
  await session.save()

  redirect('/dashboard')
}

export async function register(_prevState: { error: string } | undefined, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const age = parseInt(formData.get('age') as string) || null
  const strokeSpecialty = formData.get('strokeSpecialty') as string || null

  if (!name || name.trim().length === 0) return { error: 'Name is required' }
  if (!email || !email.includes('@')) return { error: 'A valid email is required' }
  if (!password || password.length < 6) return { error: 'Password must be at least 6 characters' }

  const db = getDb()
  const existing = getUserByEmail(db, email)
  if (existing) return { error: 'An account with that email already exists' }

  const passwordHash = await bcrypt.hash(password, 10)
  const userId = createUser(db, { name, email, passwordHash, role: 'swimmer' })
  createSwimmer(db, { userId, age, strokeSpecialty })

  const session = await getSession()
  session.userId = userId
  session.role = 'swimmer'
  session.name = name
  await session.save()

  redirect('/dashboard')
}

export async function logout() {
  const session = await getSession()
  session.destroy()
  redirect('/login')
}
