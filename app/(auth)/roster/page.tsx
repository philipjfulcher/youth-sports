import { requireCoach } from '@/lib/session'
import { getDb } from '@/lib/db'
import { getAllSwimmers } from '@/lib/queries/swimmers'
import { getRecordsForSwimmer } from '@/lib/queries/records'

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

export default async function RosterPage() {
  await requireCoach()
  const db = getDb()
  const swimmers = await getAllSwimmers(db)
  const recordsBySwimmer = await Promise.all(
    swimmers.map(s => getRecordsForSwimmer(db, s.id))
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-8">Team Roster ({swimmers.length} swimmers)</h1>
      <div className="space-y-4">
        {swimmers.map((swimmer, idx) => {
          const records = recordsBySwimmer[idx]
          return (
            <div key={swimmer.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <div>
                  <div className="font-semibold text-gray-900">{swimmer.name}</div>
                  <div className="text-sm text-gray-500">
                    {swimmer.age ? `Age ${swimmer.age} · ` : ''}
                    {swimmer.stroke_specialty ?? 'No specialty'}
                  </div>
                </div>
                <span className="text-sm text-gray-400">{records.length} times recorded</span>
              </div>
              {records.length > 0 && (
                <table className="w-full text-sm">
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-5 py-2 text-gray-500 capitalize">{r.stroke}</td>
                        <td className="px-5 py-2 text-gray-500">{r.distance}m</td>
                        <td className="px-5 py-2 text-right font-mono text-blue-700">{formatTime(r.time_seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
