import { requireCoach } from '@/lib/session'
import { createNewEvent } from '@/app/actions/events'

export default async function NewEventPage() {
  await requireCoach()

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Create New Event</h1>
      <form action={createNewEvent} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input name="title" type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
          <input name="eventDate" type="datetime-local" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input name="location" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
          <select name="eventType" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="practice">Practice</option>
            <option value="meet">Meet</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-800 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
          Create Event
        </button>
      </form>
    </div>
  )
}
