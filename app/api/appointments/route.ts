import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notifyAppointmentCreated } from '@/lib/notifications'

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

// Helper function to check appointment conflicts
async function checkAppointmentConflict(
  doctorId: string,
  appointmentDate: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
) {
  let query = supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', appointmentDate)
    .neq('status', 'cancelled')

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId)
  }

  const { data: existingAppointments } = await query

  if (!existingAppointments || existingAppointments.length === 0) {
    return false
  }

  // Check for time overlap
  const { data: conflicts } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', appointmentDate)
    .neq('status', 'cancelled')
    .or(`start_time.lte.${startTime},end_time.gte.${endTime}`)
    .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)

  if (excludeAppointmentId && conflicts) {
    return conflicts.some(c => c.id !== excludeAppointmentId)
  }

  return conflicts && conflicts.length > 0
}

// GET - Get appointments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const doctorId = searchParams.get('doctor_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
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

    // Verify user has access to this clinic (staff) OR is a patient filtering their own appointments
    const hasAccess = await verifyClinicAccess(user.id, clinicId)

    // Build query
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        created_at,
        patient:patients(id, first_name, last_name, phone),
        doctor:profiles!doctor_id(id, full_name),
        service:services(id, name, duration_minutes)
      `)
      .eq('clinic_id', clinicId)

    // If not staff, check if user is a patient and filter to their appointments only
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

      // Filter to patient's appointments only
      query = query.eq('patient_id', patientCheck.id)
    }

    // Apply filters
    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }
    if (startDate) {
      query = query.gte('appointment_date', startDate)
    }
    if (endDate) {
      query = query.lte('appointment_date', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Order by date and time
    query = query.order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    const { data: appointments, error: appointmentsError } = await query

    if (appointmentsError) {
      return NextResponse.json(
        { error: appointmentsError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      appointments: appointments || [],
    })
  } catch (error: any) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      patient_id,
      doctor_id,
      service_id,
      appointment_date,
      start_time,
      end_time,
      status = 'scheduled',
      notes,
    } = body

    // Validate required fields
    if (!clinic_id || !patient_id || !doctor_id || !service_id || !appointment_date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify user has access to this clinic (staff) OR is the patient booking for themselves
    const hasAccess = await verifyClinicAccess(user.id, clinic_id)

    if (!hasAccess) {
      // Check if user is the patient booking for themselves
      const { data: patientCheck } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('id', patient_id)
        .eq('profile_id', user.id)
        .single()

      if (!patientCheck) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only book appointments for yourself' },
          { status: 403 }
        )
      }
    }

    // Check for appointment conflicts
    const hasConflict = await checkAppointmentConflict(
      doctor_id,
      appointment_date,
      start_time,
      end_time
    )

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Appointment conflict: Doctor is not available at this time' },
        { status: 409 }
      )
    }

    // Create appointment
    const { data: appointment, error: insertError } = await supabaseAdmin
      .from('appointments')
      .insert({
        clinic_id,
        patient_id,
        doctor_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes: notes || null,
        created_by: user.id,
      })
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        created_at,
        patient:patients(id, first_name, last_name, phone),
        doctor:profiles!doctor_id(id, full_name),
        service:services(id, name, duration_minutes)
      `)
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      )
    }

    // Get patient profile_id for notification
    const { data: patientData } = await supabaseAdmin
      .from('patients')
      .select('profile_id')
      .eq('id', patient_id)
      .single()

    // Supabase may return relational joins as arrays; normalize doctor reference
    const doctorRecord = appointment
      ? (Array.isArray(appointment.doctor) ? appointment.doctor[0] : appointment.doctor)
      : null

    // Send notification if patient has a profile
    if (patientData?.profile_id && appointment) {
      await notifyAppointmentCreated(
        patientData.profile_id,
        appointment.id,
        doctorRecord?.full_name ?? 'Unknown Doctor',
        appointment.appointment_date,
        appointment.start_time
      )
    }

    return NextResponse.json({
      success: true,
      appointment,
    })
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
