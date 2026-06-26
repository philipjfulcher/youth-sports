import { getSession } from '@/lib/session'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session.userId) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/dashboard" className="text-lg font-bold">🐟 Riverside Marlins</Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="hover:text-blue-200">Dashboard</Link>
          <Link href="/events" className="hover:text-blue-200">Events</Link>
          {session.role === 'swimmer' && <Link href="/profile" className="hover:text-blue-200">My Profile</Link>}
          {session.role === 'coach' && <Link href="/roster" className="hover:text-blue-200">Roster</Link>}
          <span className="text-blue-300">|</span>
          <span className="text-blue-200">{session.name}</span>
          <form action={logout}>
            <button type="submit" className="text-blue-300 hover:text-white">Sign out</button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
