'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  return <>{children}</>
}
