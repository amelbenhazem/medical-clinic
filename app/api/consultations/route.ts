import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const doctorId = searchParams.get('doctor_id')
    const appointmentId = searchParams.get('appointment_id')
    const limit = searchParams.get('limit')

    // Check if user is a doctor
    const { data: doctorCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'doctor')
      .single()

    // If not a doctor, check if user is a patient and restrict to their consultations
    if (!doctorCheck) {
      const { data: patientCheck } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (!patientCheck) {
        return NextResponse.json(
          { error: 'Unauthorized: You do not have access to consultations' },
          { status: 403 }
        )
      }

      // Force filter to patient's own consultations
      if (patientId && patientId !== patientCheck.id) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only view your own consultations' },
          { status: 403 }
        )
      }
    }

    let query = supabaseAdmin
      .from('consultations')
      .select(`
        *,
        patient:patients(id, first_name, last_name, date_of_birth),
        doctor:profiles!consultations_doctor_id_fkey(id, full_name),
        appointment:appointments(id, appointment_date, start_time, status),
        prescriptions(*)
      `)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: consultations, error } = await query

    if (error) {
      console.error('Error fetching consultations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ consultations })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      appointment_id,
      patient_id,
      doctor_id,
      diagnosis,
      symptoms,
      examination_notes,
      treatment_plan,
      follow_up_date,
    } = body

    // Validate required fields
    if (!patient_id || !doctor_id) {
      return NextResponse.json(
        { error: 'Patient ID and Doctor ID are required' },
        { status: 400 }
      )
    }

    // Check if consultation already exists for this appointment
    if (appointment_id) {
      const { data: existing } = await supabaseAdmin
        .from('consultations')
        .select('id')
        .eq('appointment_id', appointment_id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Consultation already exists for this appointment' },
          { status: 400 }
        )
      }
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert({
        appointment_id,
        patient_id,
        doctor_id,
        diagnosis,
        symptoms,
        examination_notes,
        treatment_plan,
        follow_up_date,
      })
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        doctor:profiles!consultations_doctor_id_fkey(id, full_name),
        appointment:appointments(id, appointment_date, start_time)
      `)
      .single()

    if (error) {
      console.error('Error creating consultation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If linked to appointment, mark appointment as completed
    if (appointment_id) {
      await supabaseAdmin
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment_id)
    }

    return NextResponse.json({ consultation }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
