'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database.types'
import { SmartSlotSuggestions } from '@/components/ai/smart-slot-suggestions'

type Patient = Tables<'patients'>
type Service = Tables<'services'>

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  doctor_id: z.string().min(1, 'Doctor is required'),
  service_id: z.string().min(1, 'Service is required'),
  appointment_date: z.date({
    required_error: 'Date is required',
  }),
  start_time: z.string().min(1, 'Time slot is required'),
  notes: z.string().optional(),
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

type Doctor = {
  id: string
  full_name: string
}

interface AppointmentFormProps {
  clinicId: string
  patients: Patient[]
  doctors: Doctor[]
  services: Service[]
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
  mode?: 'create' | 'edit'
}

export function AppointmentForm({
  clinicId,
  patients,
  doctors,
  services,
  onSuccess,
  onCancel,
  initialData,
  mode = 'create',
}: AppointmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: initialData
      ? {
          patient_id: initialData.patient_id,
          doctor_id: initialData.doctor_id,
          service_id: initialData.service_id,
          appointment_date: new Date(initialData.appointment_date),
          start_time: initialData.start_time,
          notes: initialData.notes || '',
        }
      : {
          patient_id: '',
          doctor_id: '',
          service_id: '',
          appointment_date: undefined,
          start_time: '',
          notes: '',
        },
  })

  const watchedPatientId = form.watch('patient_id')
  const watchedDoctorId = form.watch('doctor_id')
  const watchedDate = form.watch('appointment_date')
  const watchedServiceId = form.watch('service_id')

  // Fetch available slots when doctor, date, or service changes
  useEffect(() => {
    if (watchedDoctorId && watchedDate && watchedServiceId) {
      fetchAvailableSlots()
    } else {
      setAvailableSlots([])
    }
  }, [watchedDoctorId, watchedDate, watchedServiceId])

  const fetchAvailableSlots = async () => {
    if (!watchedDoctorId || !watchedDate || !watchedServiceId) return

    setLoadingSlots(true)
    try {
      const formattedDate = format(watchedDate, 'yyyy-MM-dd')
      const response = await fetch(
        `/api/appointments/available-slots?clinic_id=${clinicId}&doctor_id=${watchedDoctorId}&date=${formattedDate}&service_id=${watchedServiceId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch available slots')
      }

      setAvailableSlots(data.available_slots || [])
    } catch (err: any) {
      console.error('Error fetching slots:', err)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const onSubmit = async (values: AppointmentFormValues) => {
    setLoading(true)
    setError(null)

    try {
      // Get service duration to calculate end time
      const service = services.find(s => s.id === values.service_id)
      if (!service) {
        throw new Error('Service not found')
      }

      const [hours, minutes] = values.start_time.split(':').map(Number)
      const endMinutes = hours * 60 + minutes + service.duration_minutes
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const end_time = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`

      const appointmentData = {
        clinic_id: clinicId,
        patient_id: values.patient_id,
        doctor_id: values.doctor_id,
        service_id: values.service_id,
        appointment_date: format(values.appointment_date, 'yyyy-MM-dd'),
        start_time: values.start_time,
        end_time,
        notes: values.notes || null,
      }

      const url = mode === 'edit' && initialData?.id
        ? `/api/appointments/${initialData.id}`
        : '/api/appointments'

      const response = await fetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} appointment`)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} appointment`)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} - {patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="doctor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointment_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Slot</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loadingSlots || availableSlots.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingSlots
                          ? 'Loading slots...'
                          : availableSlots.length === 0
                          ? 'No slots available'
                          : 'Select time'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {formatTimeSlot(slot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Suggestions IA Intelligentes */}
        {watchedPatientId && watchedDoctorId && watchedServiceId && watchedDate && availableSlots.length > 0 && (
          <SmartSlotSuggestions
            patientId={form.watch('patient_id')}
            doctorId={watchedDoctorId}
            serviceId={watchedServiceId}
            date={format(watchedDate, 'yyyy-MM-dd')}
            notes={form.watch('notes') || ''}
            availableSlots={availableSlots}
            onSlotSelect={(time) => {
              form.setValue('start_time', time)
            }}
          />
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? mode === 'edit'
                ? 'Updating...'
                : 'Booking...'
              : mode === 'edit'
              ? 'Update Appointment'
              : 'Book Appointment'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
