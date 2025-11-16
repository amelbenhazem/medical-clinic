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

    const { data: medicalHistory, error } = await supabaseAdmin
      .from('medical_history')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching medical history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!medicalHistory) {
      return NextResponse.json(
        { error: 'Medical history not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ medical_history: medicalHistory })
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
      allergies,
      chronic_conditions,
      past_surgeries,
      family_history,
      blood_type,
      notes,
    } = body

    const updateData: any = {}
    if (allergies !== undefined) updateData.allergies = allergies
    if (chronic_conditions !== undefined)
      updateData.chronic_conditions = chronic_conditions
    if (past_surgeries !== undefined) updateData.past_surgeries = past_surgeries
    if (family_history !== undefined) updateData.family_history = family_history
    if (blood_type !== undefined) updateData.blood_type = blood_type
    if (notes !== undefined) updateData.notes = notes

    updateData.updated_at = new Date().toISOString()

    const { data: medicalHistory, error } = await supabaseAdmin
      .from('medical_history')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating medical history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ medical_history: medicalHistory })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
