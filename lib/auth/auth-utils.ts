import { Database } from '@/types/database.types'

export type UserRole = Database['public']['Enums']['user_role']

export const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/admin',
  doctor: '/doctor',
  receptionist: '/receptionist',
  patient: '/patient',
}

export const PUBLIC_ROUTES = ['/login', '/register']

export function getRoleRedirect(role: UserRole): string {
  return ROLE_ROUTES[role] || '/patient'
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

export function isAuthorizedForRoute(role: UserRole, pathname: string): boolean {
  // Public routes are accessible to all
  if (isPublicRoute(pathname)) {
    return true
  }

  // Root route is accessible to all authenticated users
  if (pathname === '/') {
    return true
  }

  // Check if the pathname starts with the user's role route
  const roleRoute = ROLE_ROUTES[role]
  return pathname.startsWith(roleRoute)
}
