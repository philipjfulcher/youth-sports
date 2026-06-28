export const dynamic = 'force-dynamic'

import { getDb } from '@/lib/db'
import { getTeamRecords } from '@/lib/queries/records'

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

export default function RecordsPage() {
  const db = getDb()
  const records = getTeamRecords(db)

  const grouped = records.reduce<Record<string, typeof records>>((acc, r) => {
    const key = `${r.stroke} — ${r.distance}m`
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Team Records</h1>
      <p className="text-gray-600 mb-10">Best times recorded by Riverside Marlins swimmers.</p>
      <div className="space-y-6">
        {Object.entries(grouped).map(([event, times]) => (
          <div key={event} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-blue-900 capitalize">{event}</h2>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {times.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-5 py-3 text-right font-mono text-blue-700">{formatTime(r.time_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
