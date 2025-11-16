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
    const consultationId = searchParams.get('consultation_id')

    // Check if user is patient
    const { data: patientCheck } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    // Check if user is staff
    const { data: staffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!patientCheck && !staffCheck) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabaseAdmin
      .from('medical_documents')
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        consultation:consultations(id, diagnosis, created_at)
      `)
      .order('uploaded_at', { ascending: false })

    // If user is a patient, only show their documents
    if (patientCheck && !staffCheck) {
      query = query.eq('patient_id', patientCheck.id)
    } else if (patientId) {
      // Staff can filter by patient_id
      query = query.eq('patient_id', patientId)
    }

    if (consultationId) {
      query = query.eq('consultation_id', consultationId)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error in documents GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
