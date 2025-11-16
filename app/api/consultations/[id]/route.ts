import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .select(`
        *,
        patient:patients(id, first_name, last_name, date_of_birth, phone),
        doctor:profiles!consultations_doctor_id_fkey(id, full_name),
        appointment:appointments(id, appointment_date, start_time, status),
        prescriptions(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching consultation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ consultation })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      diagnosis,
      symptoms,
      examination_notes,
      treatment_plan,
      follow_up_date,
    } = body

    const updateData: any = {}
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis
    if (symptoms !== undefined) updateData.symptoms = symptoms
    if (examination_notes !== undefined)
      updateData.examination_notes = examination_notes
    if (treatment_plan !== undefined) updateData.treatment_plan = treatment_plan
    if (follow_up_date !== undefined) updateData.follow_up_date = follow_up_date

    updateData.updated_at = new Date().toISOString()

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        doctor:profiles!consultations_doctor_id_fkey(id, full_name),
        appointment:appointments(id, appointment_date, start_time)
      `)
      .single()

    if (error) {
      console.error('Error updating consultation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ consultation })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
