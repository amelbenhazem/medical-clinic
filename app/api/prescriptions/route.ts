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
    const consultationId = searchParams.get('consultation_id')

    let query = supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        doctor:profiles!prescriptions_doctor_id_fkey(id, full_name),
        consultation:consultations(id, diagnosis, created_at)
      `)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    if (consultationId) {
      query = query.eq('consultation_id', consultationId)
    }

    const { data: prescriptions, error } = await query

    if (error) {
      console.error('Error fetching prescriptions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prescriptions })
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
      consultation_id,
      patient_id,
      doctor_id,
      medications,
      instructions,
      valid_until,
    } = body

    // Validate required fields
    if (!patient_id || !doctor_id || !medications || medications.length === 0) {
      return NextResponse.json(
        { error: 'Patient ID, Doctor ID, and at least one medication are required' },
        { status: 400 }
      )
    }

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .insert({
        consultation_id,
        patient_id,
        doctor_id,
        medications,
        instructions,
        valid_until,
      })
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        doctor:profiles!prescriptions_doctor_id_fkey(id, full_name),
        consultation:consultations(id, diagnosis)
      `)
      .single()

    if (error) {
      console.error('Error creating prescription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prescription }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
