import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notifyAppointmentConfirmed, notifyAppointmentCancelled } from '@/lib/notifications'

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

// GET - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        clinic_id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        created_at,
        patient:patients(id, first_name, last_name, phone, date_of_birth),
        doctor:profiles!doctor_id(id, full_name),
        service:services(id, name, duration_minutes)
      `)
      .eq('id', id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this clinic
    const hasAccess = await verifyClinicAccess(user.id, appointment.clinic_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      appointment,
    })
  } catch (error: any) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      appointment_date,
      start_time,
      end_time,
      status,
      notes,
    } = body

    // Get current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get appointment to check clinic access
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('clinic_id, doctor_id')
      .eq('id', id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this clinic
    const hasAccess = await verifyClinicAccess(user.id, appointment.clinic_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Check for conflicts if rescheduling
    if (appointment_date && start_time && end_time) {
      const { data: conflicts } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('doctor_id', appointment.doctor_id)
        .eq('appointment_date', appointment_date)
        .neq('id', id)
        .neq('status', 'cancelled')
        .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time})`)

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: 'Appointment conflict: Doctor is not available at this time' },
          { status: 409 }
        )
      }
    }

    // Update appointment
    const updateData: any = {}
    if (appointment_date !== undefined) updateData.appointment_date = appointment_date
    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', id)
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

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // Supabase can return relational data as arrays; normalize patient reference
    const patientRecord = Array.isArray(updatedAppointment.patient)
      ? updatedAppointment.patient[0]
      : updatedAppointment.patient
    const doctorRecord = Array.isArray(updatedAppointment.doctor)
      ? updatedAppointment.doctor[0]
      : updatedAppointment.doctor

    // Get patient profile_id for notification
    let patientProfileId: string | null = null
    if (patientRecord?.id) {
      const { data: patientData } = await supabaseAdmin
        .from('patients')
        .select('profile_id')
        .eq('id', patientRecord.id)
        .single()

      patientProfileId = patientData?.profile_id ?? null
    }

    // Send notification if status changed
    if (patientProfileId && status && updatedAppointment) {
      if (status === 'confirmed') {
        await notifyAppointmentConfirmed(
          patientProfileId,
          updatedAppointment.id,
          doctorRecord?.full_name ?? 'Unknown Doctor',
          updatedAppointment.appointment_date,
          updatedAppointment.start_time
        )
      } else if (status === 'cancelled') {
        await notifyAppointmentCancelled(
          patientProfileId,
          updatedAppointment.id,
          doctorRecord?.full_name ?? 'Unknown Doctor',
          updatedAppointment.appointment_date
        )
      }
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
    })
  } catch (error: any) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get appointment to check clinic access
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('clinic_id')
      .eq('id', id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const hasAccess = await verifyClinicAccess(user.id, appointment.clinic_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Soft delete - mark as cancelled instead of deleting
    const { error: deleteError } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Error cancelling appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
