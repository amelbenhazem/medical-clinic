'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { UserRole, getRoleRedirect } from '@/lib/auth/auth-utils'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user || !profile) {
        router.push('/login')
        return
      }

      // Check if user role is allowed
      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        // Redirect to their appropriate dashboard
        const redirectPath = getRoleRedirect(profile.role)
        router.push(redirectPath)
      }
    }
  }, [user, profile, loading, allowedRoles, router])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  // Not authenticated
  if (!user || !profile) {
    return null
  }

  // Not authorized
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return null
  }

  return <>{children}</>
}
