'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database.types'

type Profile = Tables<'profiles'>

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    let userResolved = false

    const fetchProfile = async (userId: string) => {
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )

        const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

        if (!error && data && mounted) {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    const loadingTimeout = setTimeout(() => {
      if (mounted && !userResolved) {
        userResolved = true
        setLoading(false)
      }
    }, 2000)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setUser(session?.user ?? null)

      if (!userResolved) {
        userResolved = true
        clearTimeout(loadingTimeout)
        setLoading(false)
      }

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      clearTimeout(loadingTimeout)
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (!user) return

    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
