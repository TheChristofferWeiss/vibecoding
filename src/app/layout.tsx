import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next.js + Supabase + Vercel Starter',
  description: 'A production-ready starter template with authentication, database, and deployment configured',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

