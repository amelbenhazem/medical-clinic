'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Tables } from '@/types/database.types'

type Clinic = Tables<'clinics'>

export function useClinic() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClinic = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/clinic')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch clinic')
      }

      setClinic(data.clinic)
    } catch (error) {
      console.error('Error fetching clinic:', error)
      setClinic(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClinic()
  }, [user])

  const refreshClinic = () => {
    setLoading(true)
    fetchClinic()
  }

  return {
    clinic,
    loading,
    hasClinic: !!clinic,
    refreshClinic,
  }
}
