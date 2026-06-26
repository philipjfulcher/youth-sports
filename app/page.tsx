import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white">
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold mb-4">Riverside Marlins</h1>
        <p className="text-xl text-blue-200 mb-2">Youth Competitive Swimming</p>
        <p className="text-blue-300 mb-10">Building champions in the water and in life since 2008.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="bg-white text-blue-900 font-bold px-6 py-3 rounded-lg hover:bg-blue-100 transition">
            Join the Team
          </Link>
          <Link href="/schedule" className="border border-white px-6 py-3 rounded-lg hover:bg-blue-800 transition">
            View Schedule
          </Link>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-3 gap-8 text-center">
        <div className="bg-blue-800 rounded-xl p-6">
          <div className="text-3xl font-bold">8+</div>
          <div className="text-blue-300 text-sm mt-1">Active Swimmers</div>
        </div>
        <div className="bg-blue-800 rounded-xl p-6">
          <div className="text-3xl font-bold">2</div>
          <div className="text-blue-300 text-sm mt-1">Certified Coaches</div>
        </div>
        <div className="bg-blue-800 rounded-xl p-6">
          <div className="text-3xl font-bold">18+</div>
          <div className="text-blue-300 text-sm mt-1">Years Together</div>
        </div>
      </div>
    </div>
  )
}
