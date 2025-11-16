'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { UserRole } from '@/lib/auth/auth-utils'

export function useRole() {
  const { profile } = useAuth()

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return profile?.role ? roles.includes(profile.role) : false
  }

  const isAdmin = hasRole('admin')
  const isDoctor = hasRole('doctor')
  const isReceptionist = hasRole('receptionist')
  const isPatient = hasRole('patient')

  return {
    role: profile?.role,
    hasRole,
    hasAnyRole,
    isAdmin,
    isDoctor,
    isReceptionist,
    isPatient,
  }
}
