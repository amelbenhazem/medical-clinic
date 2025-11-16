'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { getRoleRedirect } from '@/lib/auth/auth-utils'

export default function Home() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        const redirectPath = getRoleRedirect(profile.role)
        router.push(redirectPath)
      } else {
        router.push('/login')
      }
    }
  }, [user, profile, loading, router])

  // Show loading state while checking authentication
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-neutral-600">Loading...</div>
    </div>
  )
}
