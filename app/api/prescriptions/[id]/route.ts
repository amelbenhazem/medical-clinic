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

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        patient:patients(id, first_name, last_name, date_of_birth, phone),
        doctor:profiles!prescriptions_doctor_id_fkey(id, full_name),
        consultation:consultations(id, diagnosis, created_at)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching prescription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ prescription })
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
    const { medications, instructions, valid_until } = body

    const updateData: any = {}
    if (medications !== undefined) updateData.medications = medications
    if (instructions !== undefined) updateData.instructions = instructions
    if (valid_until !== undefined) updateData.valid_until = valid_until

    updateData.updated_at = new Date().toISOString()

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        doctor:profiles!prescriptions_doctor_id_fkey(id, full_name),
        consultation:consultations(id, diagnosis)
      `)
      .single()

    if (error) {
      console.error('Error updating prescription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prescription })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { error } = await supabaseAdmin
      .from('prescriptions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting prescription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
