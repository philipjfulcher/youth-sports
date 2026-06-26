'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { register } from '@/app/actions/auth'
import Link from 'next/link'

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="w-full bg-blue-800 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function RegisterPage() {
  const [state, action] = useFormState(register, undefined)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Join the Marlins</h1>
        <form action={action} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required minLength={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input name="age" type="number" min={8} max={18} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stroke Specialty</label>
            <select name="strokeSpecialty" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a stroke</option>
              <option value="freestyle">Freestyle</option>
              <option value="backstroke">Backstroke</option>
              <option value="breaststroke">Breaststroke</option>
              <option value="butterfly">Butterfly</option>
              <option value="individual medley">Individual Medley</option>
            </select>
          </div>
          <SubmitButton label="Create Account" pendingLabel="Creating account…" />
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already a member? <Link href="/login" className="text-blue-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
