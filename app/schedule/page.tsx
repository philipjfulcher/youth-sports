export const dynamic = 'force-dynamic'

import { getDb } from '@/lib/db'
import { getAllMeets } from '@/lib/queries/meets'

export default async function SchedulePage() {
  const db = getDb()
  const meets = await getAllMeets(db)

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Meet Schedule</h1>
      <p className="text-gray-600 mb-10">Past and upcoming competition schedule for the Riverside Marlins.</p>
      <div className="space-y-4">
        {meets.map(meet => (
          <div key={meet.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{meet.name}</h2>
                <p className="text-sm text-gray-500">{meet.location}</p>
              </div>
              <span className="text-sm text-gray-500">{new Date(meet.date).toLocaleDateString()}</span>
            </div>
            {meet.results_summary && (
              <p className="mt-3 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">{meet.results_summary}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
