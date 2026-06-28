'use client'

import { logout } from '@/app/actions/auth'

export function LogoutButton() {
  async function handleLogout() {
    pendo.clearSession()
    await logout()
  }

  return (
    <form action={handleLogout}>
      <button type="submit" className="text-blue-300 hover:text-white">Sign out</button>
    </form>
  )
}
