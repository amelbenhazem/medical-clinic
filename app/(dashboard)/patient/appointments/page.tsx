'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, User, CalendarPlus, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

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

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const response = await fetch('/api/patients/me')
      const result = await response.json()

      if (response.ok) {
        // Fetch all appointments (not just upcoming) - need to pass clinic_id
        const allAppointmentsResponse = await fetch(
          `/api/appointments?clinic_id=${result.patient.clinic_id}&patient_id=${result.patient.id}`
        )
        const allAppointments = await allAppointmentsResponse.json()

        if (allAppointmentsResponse.ok) {
          setAppointments(allAppointments.appointments || [])
        } else {
          console.error('Error fetching appointments:', allAppointments.error)
        }
      } else {
        console.error('Error fetching patient data:', result.error)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointment_date)
    aptDate.setHours(0, 0, 0, 0)
    return aptDate >= today && apt.status !== 'cancelled'
  }).sort((a, b) => {
    const dateCompare = new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
    if (dateCompare !== 0) return dateCompare
    return a.start_time.localeCompare(b.start_time)
  })

  const pastAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointment_date)
    aptDate.setHours(0, 0, 0, 0)
    return aptDate < today || apt.status === 'completed'
  }).sort((a, b) => {
    const dateCompare = new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    if (dateCompare !== 0) return dateCompare
    return b.start_time.localeCompare(a.start_time)
  })

  const cancelledAppointments = appointments.filter((apt) => apt.status === 'cancelled').sort((a, b) => {
    const dateCompare = new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    if (dateCompare !== 0) return dateCompare
    return b.start_time.localeCompare(a.start_time)
  })

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
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
                {format(new Date(`2000-01-01T${appointment.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${appointment.end_time}`), 'h:mm a')}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-neutral-600">
              <User className="h-3 w-3" />
              Dr. {appointment.doctor.full_name}
            </div>
            {appointment.notes && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-neutral-500">
                  <span className="font-medium">Notes:</span> {appointment.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading appointments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/patient">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">My Appointments</h2>
          <p className="text-neutral-600">View all your appointments</p>
        </div>
        <Button asChild>
          <Link href="/patient/appointments/book">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Link>
        </Button>
      </div>

      {/* Appointments Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600 mb-2">No upcoming appointments</p>
                <Button asChild size="sm">
                  <Link href="/patient/appointments/book">Book Your First Appointment</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-600">
                No past appointments
              </CardContent>
            </Card>
          ) : (
            pastAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-600">
                No cancelled appointments
              </CardContent>
            </Card>
          ) : (
            cancelledAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
