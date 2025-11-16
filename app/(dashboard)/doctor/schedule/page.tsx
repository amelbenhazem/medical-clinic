'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppointmentCalendar, AppointmentEvent } from '@/components/calendar/appointment-calendar'
import { ConsultationForm } from '@/components/forms/consultation-form'
import { useClinic } from '@/hooks/use-clinic'
import { useAuth } from '@/lib/auth/auth-context'
import { Clock, User, Calendar as CalendarIcon, FileText } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'

type Appointment = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
  patient: {
    id: string
    first_name: string
    last_name: string
    phone: string
    date_of_birth: string
  }
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

export default function DoctorSchedulePage() {
  const { clinic, loading: clinicLoading } = useClinic()
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [consultationDialog, setConsultationDialog] = useState<{
    open: boolean
    appointment: Appointment | null
  }>({ open: false, appointment: null })
  const [appointmentDialog, setAppointmentDialog] = useState<{
    open: boolean
    appointment: Appointment | null
  }>({ open: false, appointment: null })

  useEffect(() => {
    if (clinic?.id && user?.id) {
      loadAppointments()
    }
  }, [clinic?.id, user?.id, currentDate])

  const loadAppointments = async () => {
    if (!clinic?.id || !user?.id) return

    setLoading(true)
    setError(null)

    try {
      // Calculate date range for current week
      const weekStart = format(startOfWeek(currentDate), 'yyyy-MM-dd')
      const weekEnd = format(endOfWeek(currentDate), 'yyyy-MM-dd')

      // Fetch only this doctor's appointments
      const response = await fetch(
        `/api/appointments?clinic_id=${clinic.id}&doctor_id=${user.id}&start_date=${weekStart}&end_date=${weekEnd}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load appointments')
      }

      setAppointments(data.appointments || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkCompleted = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appointment')
      }

      loadAppointments()
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment')
    }
  }

  // Convert appointments to calendar events
  const calendarEvents: AppointmentEvent[] = appointments.map((apt) => {
    const [year, month, day] = apt.appointment_date.split('-').map(Number)
    const [startHour, startMin] = apt.start_time.split(':').map(Number)
    const [endHour, endMin] = apt.end_time.split(':').map(Number)

    return {
      id: apt.id,
      title: `${apt.patient.first_name} ${apt.patient.last_name}`,
      start: new Date(year, month - 1, day, startHour, startMin),
      end: new Date(year, month - 1, day, endHour, endMin),
      resource: {
        status: apt.status,
        patientName: `${apt.patient.first_name} ${apt.patient.last_name}`,
        doctorName: apt.doctor.full_name,
        serviceName: apt.service.name,
        notes: apt.notes,
      },
    }
  })

  // Get upcoming appointments (today and future, not completed or cancelled)
  const now = new Date()
  const nowTime = format(now, 'HH:mm:ss')
  const today = format(now, 'yyyy-MM-dd')

  const upcomingAppointments = appointments
    .filter((apt) => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false
      if (apt.appointment_date > today) return true
      if (apt.appointment_date === today && apt.start_time >= nowTime) return true
      return false
    })
    .sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return a.appointment_date.localeCompare(b.appointment_date)
      }
      return a.start_time.localeCompare(b.start_time)
    })
    .slice(0, 5)

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (clinicLoading || !clinic) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Schedule</h2>
          <p className="text-neutral-600">View and manage your appointments</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12 text-neutral-600">Loading schedule...</div>
            ) : (
              <AppointmentCalendar
                events={calendarEvents}
                onSelectEvent={(event) => {
                  // Find the appointment by event id
                  const appointment = appointments.find(apt => apt.id === event.id)
                  if (appointment) {
                    setAppointmentDialog({ open: true, appointment })
                  }
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Next Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-sm text-neutral-600">Loading...</div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center text-sm text-neutral-600 py-4">
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {apt.patient.first_name} {apt.patient.last_name}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Age: {calculateAge(apt.patient.date_of_birth)}
                        </div>
                      </div>
                      <Badge className={getStatusColor(apt.status)} variant="secondary">
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-neutral-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(apt.appointment_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(`2000-01-01T${apt.start_time}`), 'h:mm a')} -{' '}
                        {format(new Date(`2000-01-01T${apt.end_time}`), 'h:mm a')}
                      </div>
                      <div className="text-neutral-500">{apt.service.name}</div>
                    </div>

                    {apt.notes && (
                      <div className="text-xs text-neutral-600 pt-1 border-t">
                        <span className="font-medium">Notes:</span> {apt.notes}
                      </div>
                    )}

                    {apt.status === 'confirmed' && apt.appointment_date === today && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() =>
                            setConsultationDialog({ open: true, appointment: apt })
                          }
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Add Consultation
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleMarkCompleted(apt.id)}
                        >
                          Mark Completed
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultation Dialog */}
      <Dialog
        open={consultationDialog.open}
        onOpenChange={(open) =>
          setConsultationDialog({ open, appointment: null })
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Consultation</DialogTitle>
            <DialogDescription>
              Record consultation notes for{' '}
              {consultationDialog.appointment &&
                `${consultationDialog.appointment.patient.first_name} ${consultationDialog.appointment.patient.last_name}`}
            </DialogDescription>
          </DialogHeader>
          {consultationDialog.appointment && profile && (
            <ConsultationForm
              appointmentId={consultationDialog.appointment.id}
              patientId={consultationDialog.appointment.patient.id}
              doctorId={profile.id}
              onSuccess={() => {
                setConsultationDialog({ open: false, appointment: null })
                loadAppointments()
              }}
              onCancel={() =>
                setConsultationDialog({ open: false, appointment: null })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog
        open={appointmentDialog.open}
        onOpenChange={(open) =>
          setAppointmentDialog({ open, appointment: null })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View and manage this appointment
            </DialogDescription>
          </DialogHeader>
          {appointmentDialog.appointment && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(appointmentDialog.appointment.status)}>
                  {appointmentDialog.appointment.status}
                </Badge>
              </div>

              {/* Patient Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-neutral-700">Patient</h4>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="font-medium">
                      {appointmentDialog.appointment.patient.first_name}{' '}
                      {appointmentDialog.appointment.patient.last_name}
                    </p>
                    <p className="text-sm text-neutral-500">
                      Age: {calculateAge(appointmentDialog.appointment.patient.date_of_birth)}
                    </p>
                    <p className="text-sm text-neutral-500">
                      Phone: {appointmentDialog.appointment.patient.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-neutral-700">Appointment</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-neutral-500" />
                    <span>
                      {format(
                        new Date(appointmentDialog.appointment.appointment_date),
                        'EEEE, MMMM dd, yyyy'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-neutral-500" />
                    <span>
                      {format(
                        new Date(`2000-01-01T${appointmentDialog.appointment.start_time}`),
                        'h:mm a'
                      )}{' '}
                      -{' '}
                      {format(
                        new Date(`2000-01-01T${appointmentDialog.appointment.end_time}`),
                        'h:mm a'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-neutral-500" />
                    <span>{appointmentDialog.appointment.service.name}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {appointmentDialog.appointment.notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-neutral-700">Notes</h4>
                  <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                    {appointmentDialog.appointment.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              {appointmentDialog.appointment.status === 'confirmed' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setConsultationDialog({
                        open: true,
                        appointment: appointmentDialog.appointment,
                      })
                      setAppointmentDialog({ open: false, appointment: null })
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Consultation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (appointmentDialog.appointment) {
                        handleMarkCompleted(appointmentDialog.appointment.id)
                        setAppointmentDialog({ open: false, appointment: null })
                      }
                    }}
                  >
                    Mark Completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
