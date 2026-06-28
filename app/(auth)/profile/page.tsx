import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { getSwimmerByUserId } from '@/lib/queries/swimmers'
import { getRecordsForSwimmer } from '@/lib/queries/records'

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

export default async function ProfilePage() {
  const session = await getSession()
  const db = getDb()
  const swimmer = getSwimmerByUserId(db, session.userId!)
  const records = swimmer ? getRecordsForSwimmer(db, swimmer.id) : []

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-blue-900 mb-1">{session.name}</h1>
      <p className="text-gray-500 mb-8">
        {swimmer?.age ? `Age ${swimmer.age} · ` : ''}
        {swimmer?.stroke_specialty ? `Specialty: ${swimmer.stroke_specialty}` : 'No specialty set'}
      </p>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-5 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-blue-900">My Times</h2>
        </div>
        {records.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500">No recorded times yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Stroke</th>
                <th className="px-5 py-3 text-left">Distance</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-5 py-3 capitalize">{r.stroke}</td>
                  <td className="px-5 py-3">{r.distance}m</td>
                  <td className="px-5 py-3 text-right font-mono text-blue-700">{formatTime(r.time_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
