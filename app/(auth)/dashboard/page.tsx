import { getSession } from '@/lib/session'
import { getAllEvents } from '@/lib/queries/events'
import { getSignupsForUser } from '@/lib/queries/signups'
import Link from 'next/link'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function DashboardPage() {
  const session = await getSession()
  const [allEvents, signups] = await Promise.all([
    getAllEvents(),
    getSignupsForUser(session.userId!),
  ])
  const signedUpIds = new Set(signups.map(s => s.event_id))
  const upcomingSignups = allEvents.filter(e => signedUpIds.has(e.id))

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-1">Welcome back, {session.name}!</h1>
      <p className="text-gray-500 mb-8 capitalize">Signed in as {session.role}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Your Upcoming Events ({upcomingSignups.length})</h2>
          {upcomingSignups.length === 0 ? (
            <p className="text-sm text-gray-500">You haven&apos;t signed up for any events yet. <Link href="/events" className="text-blue-700 hover:underline">Browse events</Link></p>
          ) : (
            <ul className="space-y-3">
              {upcomingSignups.map(event => (
                <li key={event.id} className="text-sm">
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-gray-500">{formatDate(event.event_date)} · {event.location}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/events" className="text-blue-700 hover:underline">Browse &amp; sign up for events →</Link></li>
            {session.role === 'swimmer' && <li><Link href="/profile" className="text-blue-700 hover:underline">View my times &amp; records →</Link></li>}
            {session.role === 'coach' && <li><Link href="/events/new" className="text-blue-700 hover:underline">Create a new event →</Link></li>}
            {session.role === 'coach' && <li><Link href="/roster" className="text-blue-700 hover:underline">View team roster →</Link></li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
