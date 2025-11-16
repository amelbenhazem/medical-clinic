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

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    const { data: medicalHistory, error } = await supabaseAdmin
      .from('medical_history')
      .select('*')
      .eq('patient_id', patientId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      console.error('Error fetching medical history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no medical history exists, return null (not an error)
    return NextResponse.json({ medical_history: medicalHistory || null })
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
      patient_id,
      allergies,
      chronic_conditions,
      past_surgeries,
      family_history,
      blood_type,
      notes,
    } = body

    // Validate required fields
    if (!patient_id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Check if medical history already exists for this patient
    const { data: existing } = await supabaseAdmin
      .from('medical_history')
      .select('id')
      .eq('patient_id', patient_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Medical history already exists for this patient' },
        { status: 400 }
      )
    }

    const { data: medicalHistory, error } = await supabaseAdmin
      .from('medical_history')
      .insert({
        patient_id,
        allergies: allergies || [],
        chronic_conditions: chronic_conditions || [],
        past_surgeries: past_surgeries || [],
        family_history,
        blood_type,
        notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating medical history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ medical_history: medicalHistory }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
