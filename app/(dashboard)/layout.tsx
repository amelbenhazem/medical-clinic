'use client'

import { RequireAuth } from '@/components/auth/require-auth'
import { Navbar } from '@/components/navigation/navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
      </div>
    </RequireAuth>
  )
}
