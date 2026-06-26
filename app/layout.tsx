import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Riverside Marlins',
  description: 'Youth Swimming Team',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between shadow">
          <Link href="/" className="text-xl font-bold tracking-tight">🐟 Riverside Marlins</Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/about" className="hover:text-blue-200">Coaches</Link>
            <Link href="/schedule" className="hover:text-blue-200">Schedule</Link>
            <Link href="/records" className="hover:text-blue-200">Records</Link>
            <Link href="/register" className="hover:text-blue-200">Join the Team</Link>
            <Link href="/login" className="bg-white text-blue-800 px-3 py-1 rounded hover:bg-blue-100">Login</Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
