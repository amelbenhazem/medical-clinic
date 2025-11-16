'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useClinic } from '@/hooks/use-clinic'
import { Search, User } from 'lucide-react'
import { format } from 'date-fns'

type Patient = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string | null
}

export default function DoctorPatientsPage() {
  const { clinic } = useClinic()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (clinic?.id) {
      loadPatients()
    }
  }, [clinic?.id])

  useEffect(() => {
    if (searchQuery) {
      const filtered = patients.filter((patient) => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
        const phone = patient.phone.toLowerCase()
        const email = patient.email?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()

        return (
          fullName.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        )
      })
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(patients)
    }
  }, [searchQuery, patients])

  const loadPatients = async () => {
    if (!clinic?.id) return

    setLoading(true)

    try {
      const response = await fetch(`/api/patients?clinic_id=${clinic.id}`)
      const data = await response.json()

      if (response.ok) {
        setPatients(data.patients || [])
        setFilteredPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading patients...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        <p className="text-neutral-600">View patient information and medical history</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-600">
            {searchQuery ? 'No patients found matching your search' : 'No patients registered yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Link key={patient.id} href={`/doctor/patients/${patient.id}`}>
              <Card className="hover:bg-neutral-50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {calculateAge(patient.date_of_birth)} years • {patient.gender}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">{patient.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {filteredPatients.length > 0 && (
        <p className="text-sm text-neutral-500 text-center">
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
      )}
    </div>
  )
}
