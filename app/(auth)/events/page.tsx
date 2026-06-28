import { getSession } from '@/lib/session'
import { getAllEvents } from '@/lib/queries/events'
import { getSignupsForUser } from '@/lib/queries/signups'
import { signUp, withdraw, removeEvent } from '@/app/actions/events'
import Link from 'next/link'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const eventTypeBadge: Record<string, string> = {
  meet: 'bg-red-100 text-red-700',
  practice: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-600',
}

export default async function EventsPage() {
  const session = await getSession()
  const [events, signups] = await Promise.all([
    getAllEvents(),
    getSignupsForUser(session.userId!),
  ])
  const signedUpIds = new Set(signups.map(s => s.event_id))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Upcoming Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} events scheduled</p>
        </div>
        {session.role === 'coach' && (
          <Link href="/events/new" className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Create Event
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {events.map(event => {
          const signed = signedUpIds.has(event.id)
          return (
            <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-semibold text-gray-900">{event.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventTypeBadge[event.event_type]}`}>
                    {event.event_type}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{formatDate(event.event_date)} · {event.location}</p>
                {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {session.role === 'swimmer' && (
                  signed ? (
                    <form action={withdraw.bind(null, event.id)}>
                      <button type="submit" className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                        Withdraw
                      </button>
                    </form>
                  ) : (
                    <form action={signUp.bind(null, event.id)}>
                      <button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-blue-800 text-white hover:bg-blue-700">
                        Sign Up
                      </button>
                    </form>
                  )
                )}
                {session.role === 'coach' && (
                  <form action={removeEvent.bind(null, event.id)}>
                    <button type="submit" className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
