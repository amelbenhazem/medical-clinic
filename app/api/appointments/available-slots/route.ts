import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function verifyClinicAccess(userId: string, clinicId: string) {
  const { data: staffCheck } = await supabaseAdmin
    .from('clinic_staff')
    .select('role')
    .eq('clinic_id', clinicId)
    .eq('user_id', userId)
    .single()

  return !!staffCheck
}

// Helper to generate time slots
function generateTimeSlots(startHour: number, endHour: number, intervalMinutes: number) {
  const slots: string[] = []

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
      slots.push(time)
    }
  }

  return slots
}

// Helper to check if time slot overlaps with appointment
function isTimeSlotAvailable(
  slotStart: string,
  slotEnd: string,
  appointments: Array<{ start_time: string; end_time: string }>
) {
  for (const apt of appointments) {
    // Check if slot overlaps with appointment
    if (
      (slotStart >= apt.start_time && slotStart < apt.end_time) ||
      (slotEnd > apt.start_time && slotEnd <= apt.end_time) ||
      (slotStart <= apt.start_time && slotEnd >= apt.end_time)
    ) {
      return false
    }
  }
  return true
}

// Helper to add minutes to time string
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`
}

// GET - Get available time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const doctorId = searchParams.get('doctor_id')
    const date = searchParams.get('date')
    const serviceId = searchParams.get('service_id')

    if (!clinicId || !doctorId || !date || !serviceId) {
      return NextResponse.json(
        { error: 'clinic_id, doctor_id, date, and service_id are required' },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this clinic (staff) OR is a patient
    const hasAccess = await verifyClinicAccess(user.id, clinicId)

    // If not staff, check if user is a patient in this clinic
    if (!hasAccess) {
      const { data: patientCheck } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('profile_id', user.id)
        .single()

      if (!patientCheck) {
        return NextResponse.json(
          { error: 'Unauthorized: You do not have access to this clinic' },
          { status: 403 }
        )
      }
    }

    // Get service duration
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const durationMinutes = service.duration_minutes

    // Get existing appointments for this doctor on this date
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled')

    if (appointmentsError) {
      return NextResponse.json(
        { error: appointmentsError.message },
        { status: 400 }
      )
    }

    // Get day of week for the requested date (0 = Sunday, 6 = Saturday)
    const requestedDate = new Date(date + 'T00:00:00')
    const dayOfWeek = requestedDate.getDay()

    // Check doctor availability for this day
    const { data: availability, error: availabilityError } = await supabaseAdmin
      .from('doctor_availability')
      .select('start_time, end_time, is_available')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .single()

    // If doctor is not available on this day, return empty slots
    if (!availability || !availability.is_available) {
      return NextResponse.json({
        date,
        duration_minutes: durationMinutes,
        available_slots: [],
      })
    }

    // Extract working hours from doctor availability
    const [startHour, startMinute] = availability.start_time.split(':').map(Number)
    const [endHour, endMinute] = availability.end_time.split(':').map(Number)

    const slotInterval = 30 // 30-minute slots

    // Generate all possible time slots based on doctor availability
    const allSlots: string[] = []
    let currentHour = startHour
    let currentMinute = startMinute

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`
      allSlots.push(time)

      currentMinute += slotInterval
      if (currentMinute >= 60) {
        currentHour++
        currentMinute = 0
      }
    }

    // Filter available slots based on service duration and existing appointments
    const availableSlots = allSlots.filter(slotStart => {
      const slotEnd = addMinutes(slotStart, durationMinutes)

      // Check if slot end time is within working hours
      const [slotEndH, slotEndM] = slotEnd.split(':').map(Number)
      const slotEndTotalMinutes = slotEndH * 60 + slotEndM
      const workingEndTotalMinutes = endHour * 60 + endMinute

      if (slotEndTotalMinutes > workingEndTotalMinutes) {
        return false
      }

      // Check if slot is available (doesn't overlap with existing appointments)
      return isTimeSlotAvailable(slotStart, slotEnd, appointments || [])
    })

    return NextResponse.json({
      date,
      duration_minutes: durationMinutes,
      available_slots: availableSlots,
    })
  } catch (error: any) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
