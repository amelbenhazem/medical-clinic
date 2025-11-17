'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Briefcase } from 'lucide-react'
import { format } from 'date-fns'

type Doctor = {
  id: string
  full_name: string
}

type Service = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
}

type PatientData = {
  patient: {
    id: string
    clinic_id: string
    first_name: string
    last_name: string
  }
}

export default function BookAppointmentPage() {
  const router = useRouter()
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedDoctorId && selectedServiceId && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedDoctorId, selectedServiceId, selectedDate])

  const loadInitialData = async () => {
    try {
      // Get patient data
      const patientRes = await fetch('/api/patients/me')
      const patientResult = await patientRes.json()

      if (!patientRes.ok) {
        console.error('Error loading patient data:', patientResult.error)
        return
      }

      setPatientData(patientResult)

      // Get doctors
      const doctorsRes = await fetch(`/api/staff?clinic_id=${patientResult.patient.clinic_id}&role=doctor`)
      const doctorsResult = await doctorsRes.json()

      if (doctorsRes.ok) {
        // Map to use user_id as id for doctor selection
        const doctorsList = (doctorsResult.staff || []).map((staff: any) => ({
          id: staff.user_id,
          user_id: staff.user_id,
          full_name: staff.full_name || 'Unknown',
          email: staff.email,
          phone: staff.phone,
        }))
        setDoctors(doctorsList)
      }

      // Get services
      const servicesRes = await fetch(`/api/services?clinic_id=${patientResult.patient.clinic_id}`)
      const servicesResult = await servicesRes.json()

      if (servicesRes.ok) {
        setServices(servicesResult.services || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!patientData || !selectedDoctorId || !selectedServiceId || !selectedDate) return

    setLoadingSlots(true)
    setSelectedSlot('')

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(
        `/api/appointments/available-slots?clinic_id=${patientData.patient.clinic_id}&doctor_id=${selectedDoctorId}&service_id=${selectedServiceId}&date=${dateStr}`
      )
      const result = await response.json()

      if (response.ok) {
        setAvailableSlots(result.available_slots || [])
      } else {
        console.error('Error loading slots:', result.error)
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error loading slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!patientData || !selectedDoctorId || !selectedServiceId || !selectedDate || !selectedSlot) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      const selectedService = services.find(s => s.id === selectedServiceId)
      if (!selectedService) return

      const endTime = addMinutesToTime(selectedSlot, selectedService.duration_minutes)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinic_id: patientData.patient.clinic_id,
          patient_id: patientData.patient.id,
          doctor_id: selectedDoctorId,
          service_id: selectedServiceId,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedSlot,
          end_time: endTime,
          status: 'scheduled',
          notes: notes || null,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        router.push('/patient/appointments')
      } else {
        alert(result.error || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment')
    } finally {
      setSubmitting(false)
    }
  }

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60)
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return format(new Date(`2000-01-01T${hours}:${minutes}`), 'h:mm a')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  if (!patientData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to Book Appointment</CardTitle>
            <CardDescription>
              No patient record found. Please contact the clinic to register.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/patient/appointments">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Appointments
            </Link>
          </Button>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Book Appointment</h2>
        <p className="text-neutral-600">Schedule a new appointment with a doctor</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>Select doctor, service, date, and time for your appointment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label htmlFor="doctor">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Doctor *
                </div>
              </Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Service *
                </div>
              </Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedServiceId && (
                <p className="text-sm text-neutral-600">
                  {services.find(s => s.id === selectedServiceId)?.description}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date *
                </div>
              </Label>
              <div className="border rounded-md p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="mx-auto"
                />
              </div>
            </div>

            {/* Time Slot Selection */}
            {selectedDoctorId && selectedServiceId && selectedDate && (
              <div className="space-y-2">
                <Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Available Time Slots *
                  </div>
                </Label>
                {loadingSlots ? (
                  <div className="text-sm text-neutral-600 py-4 text-center">
                    Loading available slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-sm text-neutral-600 py-4 text-center">
                    No available slots for this date. Please select a different date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={selectedSlot === slot ? 'default' : 'outline'}
                        onClick={() => setSelectedSlot(slot)}
                        className="w-full"
                      >
                        {formatTime(slot)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific concerns or information for the doctor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedDoctorId || !selectedServiceId || !selectedDate || !selectedSlot || submitting}
              >
                {submitting ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
