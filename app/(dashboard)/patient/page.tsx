'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText, Clock, User, CalendarPlus } from 'lucide-react'
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

type Appointment = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  doctor: {
    id: string
    full_name: string
  }
  service: {
    id: string
    name: string
    duration_minutes: number
  }
}

type PatientData = {
  patient: Patient
  appointments: Appointment[]
  consultations_count: number
}

export default function PatientDashboard() {
  const [data, setData] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatientData()
  }, [])

  const loadPatientData = async () => {
    try {
      const response = await fetch('/api/patients/me')
      const result = await response.json()

      if (response.ok) {
        setData(result)
      } else {
        console.error('Error loading patient data:', result.error)
      }
    } catch (error) {
      console.error('Error loading patient data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-neutral-100 text-neutral-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Patient Record Not Found</CardTitle>
            <CardDescription>
              No patient record is associated with your account. Please contact the clinic to register.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { patient, appointments, consultations_count } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome, {patient.first_name} {patient.last_name}
        </h2>
        <p className="text-neutral-600">Manage your appointments and view your medical records</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-neutral-600">Scheduled appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <FileText className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultations_count}</div>
            <p className="text-xs text-neutral-600">Medical consultations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient ID</CardTitle>
            <User className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{patient.id.slice(0, 8)}</div>
            <p className="text-xs text-neutral-600">Your unique identifier</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/patient/appointments/book">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Book Appointment
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/patient/appointments">
              <Calendar className="h-4 w-4 mr-2" />
              View All Appointments
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/patient/consultations">
              <FileText className="h-4 w-4 mr-2" />
              My Medical Records
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your next scheduled appointments</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/patient/appointments">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 mb-2">No upcoming appointments</p>
              <Button asChild size="sm">
                <Link href="/patient/appointments/book">Book Your First Appointment</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{appointment.service.name}</h4>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(appointment.appointment_date), 'EEEE, MMMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(`2000-01-01T${appointment.start_time}`), 'h:mm a')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                          <User className="h-3 w-3" />
                          Dr. {appointment.doctor.full_name}
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-neutral-500 mt-2">{appointment.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
