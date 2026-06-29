import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { PendoInitializer } from '@/app/components/PendoInitializer'
import { getPendoVisitorData } from '@/lib/pendo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Riverside Marlins',
  description: 'Youth Swimming Team',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const visitorData = await getPendoVisitorData()

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
(function(apiKey){
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
    v=['initialize','identify','updateOptions','pageLoad','track', 'trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
    o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
    y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
    z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
})('53fdfe76-79fc-42f9-a4c9-03399a9db8cc');
`
        }} />
      </head>
      <body className={inter.className}>
        <PendoInitializer visitorData={visitorData} />
        <nav className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between shadow">
          <Link href="/" className="text-xl font-bold tracking-tight">🐟 Riverside Marlins</Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/coaches" className="hover:text-blue-200">Coaches</Link>
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
