'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationsPanel } from '@/components/notifications/notifications-panel'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  Building2,
  UserCog,
  Stethoscope,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  FolderOpen,
  Clock,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const roleNavigation: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Clinic', href: '/admin/clinic', icon: Building2 },
    { label: 'Staff', href: '/admin/staff', icon: UserCog },
    { label: 'Services', href: '/admin/services', icon: Settings },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
    { label: 'Schedule', href: '/doctor/schedule', icon: Calendar },
    { label: 'Patients', href: '/doctor/patients', icon: Users },
    { label: 'Consultations', href: '/doctor/consultations', icon: FileText },
    { label: 'Availability', href: '/doctor/availability', icon: Clock },
  ],
  receptionist: [
    { label: 'Dashboard', href: '/receptionist', icon: LayoutDashboard },
    { label: 'Patients', href: '/receptionist/patients', icon: Users },
    { label: 'Appointments', href: '/receptionist/appointments', icon: Calendar },
  ],
  patient: [
    { label: 'Dashboard', href: '/patient', icon: LayoutDashboard },
    { label: 'Appointments', href: '/patient/appointments', icon: Calendar },
    { label: 'Medical Records', href: '/patient/consultations', icon: FileText },
    { label: 'Documents', href: '/patient/documents', icon: FolderOpen },
    { label: 'Profile', href: '/patient/profile', icon: User },
  ],
}

export function Navbar() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!profile) return null

  const navigation = roleNavigation[profile.role] || []

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'doctor':
        return 'bg-blue-100 text-blue-800'
      case 'receptionist':
        return 'bg-green-100 text-green-800'
      case 'patient':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-8">
              <Link href={`/${profile.role}`} className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold hidden sm:block">
                  Medical Clinic
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationsPanel />

              {/* User Menu - Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-neutral-600" />
                      </div>
                      <div className="text-left hidden lg:block">
                        <div className="text-sm font-medium">{profile.full_name}</div>
                        <div
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full inline-block',
                            getRoleColor(profile.role)
                          )}
                        >
                          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile.full_name}</p>
                      <p className="text-xs text-neutral-500 capitalize">{profile.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg mb-4">
                <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">{profile.full_name}</div>
                  <div
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full inline-block mt-1',
                      getRoleColor(profile.role)
                    )}
                  >
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
