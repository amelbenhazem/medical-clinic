'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AppointmentCalendar, AppointmentEvent } from '@/components/calendar/appointment-calendar'
import { AppointmentForm } from '@/components/forms/appointment-form'
import { useClinic } from '@/hooks/use-clinic'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'
import type { Tables } from '@/types/database.types'

type Patient = Tables<'patients'>
type Service = Tables<'services'>
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

type Doctor = {
  id: string
  full_name: string
}

export default function ReceptionistAppointmentsPage() {
  const { clinic, loading: clinicLoading } = useClinic()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    if (clinic?.id) {
      loadData()
    }
  }, [clinic?.id, currentDate, selectedDoctorFilter])

  const loadData = async () => {
    if (!clinic?.id) return

    setLoading(true)
    setError(null)

    try {
      // Calculate date range for current week
      const weekStart = format(startOfWeek(currentDate), 'yyyy-MM-dd')
      const weekEnd = format(endOfWeek(currentDate), 'yyyy-MM-dd')

      // Build appointments query
      let appointmentsUrl = `/api/appointments?clinic_id=${clinic.id}&start_date=${weekStart}&end_date=${weekEnd}`
      if (selectedDoctorFilter !== 'all') {
        appointmentsUrl += `&doctor_id=${selectedDoctorFilter}`
      }

      // Fetch all data in parallel
      const [appointmentsRes, patientsRes, doctorsRes, servicesRes] = await Promise.all([
        fetch(appointmentsUrl),
        fetch(`/api/patients?clinic_id=${clinic.id}`),
        fetch(`/api/staff?clinic_id=${clinic.id}`),
        fetch(`/api/services?clinic_id=${clinic.id}`),
      ])

      const [appointmentsData, patientsData, doctorsData, servicesData] = await Promise.all([
        appointmentsRes.json(),
        patientsRes.json(),
        doctorsRes.json(),
        servicesRes.json(),
      ])

      if (!appointmentsRes.ok) throw new Error(appointmentsData.error)
      if (!patientsRes.ok) throw new Error(patientsData.error)
      if (!doctorsRes.ok) throw new Error(doctorsData.error)
      if (!servicesRes.ok) throw new Error(servicesData.error)

      setAppointments(appointmentsData.appointments || [])
      setPatients(patientsData.patients || [])
      setServices(servicesData.services || [])

      // Filter staff to only doctors
      const doctorsList = (doctorsData.staff || [])
        .filter((staff: any) => staff.role === 'doctor')
        .map((staff: any) => ({
          id: staff.user_id,
          full_name: staff.profiles?.full_name || 'Unknown',
        }))
      setDoctors(doctorsList)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleBookingSuccess = () => {
    setIsBookingOpen(false)
    loadData()
  }

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'confirmed',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to confirm appointment')
      }

      setIsDetailDialogOpen(false)
      setSelectedAppointment(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to confirm appointment')
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel appointment')
      }

      setIsDetailDialogOpen(false)
      setSelectedAppointment(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment')
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
        notes: apt.notes ?? undefined,
      },
    }
  })

  // Get today's appointments
  const today = format(new Date(), 'yyyy-MM-dd')
  const todaysAppointments = appointments.filter(
    (apt) => apt.appointment_date === today && apt.status !== 'cancelled'
  )

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
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-neutral-600">Manage clinic appointments</p>
        </div>
        <Button onClick={() => setIsBookingOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Select value={selectedDoctorFilter} onValueChange={setSelectedDoctorFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by doctor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12 text-neutral-600">Loading appointments...</div>
            ) : (
              <AppointmentCalendar
                events={calendarEvents}
                onSelectEvent={(event) => {
                  // Find the full appointment details
                  const appointment = appointments.find(apt => apt.id === event.id)
                  if (appointment) {
                    setSelectedAppointment(appointment)
                    setIsDetailDialogOpen(true)
                  }
                }}
                onSelectSlot={(slot) => {
                  // Open booking dialog (future enhancement: pre-fill date)
                  setIsBookingOpen(true)
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-sm text-neutral-600">Loading...</div>
            ) : todaysAppointments.length === 0 ? (
              <div className="text-center text-sm text-neutral-600 py-4">
                No appointments today
              </div>
            ) : (
              <div className="space-y-3">
                {todaysAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer"
                    onClick={() => {
                      setSelectedAppointment(apt)
                      setIsDetailDialogOpen(true)
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </div>
                      <Badge className={getStatusColor(apt.status)} variant="secondary">
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-neutral-600 space-y-1">
                      <div>
                        {format(new Date(`2000-01-01T${apt.start_time}`), 'h:mm a')} -{' '}
                        {format(new Date(`2000-01-01T${apt.end_time}`), 'h:mm a')}
                      </div>
                      <div>{apt.doctor.full_name}</div>
                      <div className="text-neutral-500">{apt.service.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Book Appointment Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment for a patient
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm
            clinicId={clinic.id}
            patients={patients}
            doctors={doctors}
            services={services}
            onSuccess={handleBookingSuccess}
            onCancel={() => setIsBookingOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View and manage appointment status
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Patient</h4>
                <p className="text-sm text-neutral-600">
                  {selectedAppointment.patient.first_name} {selectedAppointment.patient.last_name}
                </p>
                <p className="text-xs text-neutral-500">{selectedAppointment.patient.phone}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Doctor</h4>
                <p className="text-sm text-neutral-600">{selectedAppointment.doctor.full_name}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Service</h4>
                <p className="text-sm text-neutral-600">{selectedAppointment.service.name}</p>
                <p className="text-xs text-neutral-500">{selectedAppointment.service.duration_minutes} minutes</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Date & Time</h4>
                <p className="text-sm text-neutral-600">
                  {format(new Date(selectedAppointment.appointment_date), 'MMMM dd, yyyy')}
                </p>
                <p className="text-sm text-neutral-600">
                  {format(new Date(`2000-01-01T${selectedAppointment.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${selectedAppointment.end_time}`), 'h:mm a')}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <Badge className={getStatusColor(selectedAppointment.status)} variant="secondary">
                  {selectedAppointment.status}
                </Badge>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-neutral-600">{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedAppointment.status === 'scheduled' && (
                  <Button
                    onClick={() => handleConfirmAppointment(selectedAppointment.id)}
                    className="flex-1"
                  >
                    Confirm Appointment
                  </Button>
                )}
                {(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    className="flex-1"
                  >
                    Cancel Appointment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
