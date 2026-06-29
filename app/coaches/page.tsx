export const dynamic = 'force-dynamic'

import { getAllCoaches } from '@/lib/queries/coaches'

export default async function CoachesPage() {

  const coaches = await getAllCoaches()

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Our Coaching Staff</h1>
      <p className="text-gray-600 mb-10">Meet the dedicated coaches behind the Riverside Marlins.</p>
      <div className="space-y-8">
        {coaches.map(coach => (
          <div key={coach.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-blue-800">{coach.name}</h2>
            <p className="text-sm text-gray-500 mb-3">{coach.years_experience} years experience</p>
            <p className="text-gray-700">{coach.bio}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
