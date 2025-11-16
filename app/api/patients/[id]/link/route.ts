import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function verifyClinicAccess(userId: string, clinicId: string) {
  const { data: staffCheck } = await supabaseAdmin
    .from('clinic_staff')
    .select('role')
    .eq('clinic_id', clinicId)
    .eq('user_id', userId)
    .single()

  return !!staffCheck
}

// POST - Link patient to user account
export async function POST(
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

    const { id: patientId } = await params
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Get patient to verify clinic access
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('clinic_id, profile_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this clinic
    const hasAccess = await verifyClinicAccess(user.id, patient.clinic_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Check if patient is already linked
    if (patient.profile_id) {
      return NextResponse.json(
        { error: 'Patient is already linked to a user account' },
        { status: 400 }
      )
    }

    // Check if user is already linked to another patient
    const { data: existingLink } = await supabaseAdmin
      .from('patients')
      .select('id, first_name, last_name')
      .eq('profile_id', user_id)
      .single()

    if (existingLink) {
      return NextResponse.json(
        {
          error: `This user is already linked to patient: ${existingLink.first_name} ${existingLink.last_name}`,
        },
        { status: 400 }
      )
    }

    // Link patient to user
    const { data: updatedPatient, error: updateError } = await supabaseAdmin
      .from('patients')
      .update({ profile_id: user_id })
      .eq('id', patientId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
      message: 'Patient successfully linked to user account',
    })
  } catch (error) {
    console.error('Error linking patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Unlink patient from user account
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

    const { id: patientId } = await params

    // Get patient to verify clinic access
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('clinic_id, profile_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this clinic
    const hasAccess = await verifyClinicAccess(user.id, patient.clinic_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Unlink patient from user
    const { data: updatedPatient, error: updateError } = await supabaseAdmin
      .from('patients')
      .update({ profile_id: null })
      .eq('id', patientId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
      message: 'Patient successfully unlinked from user account',
    })
  } catch (error) {
    console.error('Error unlinking patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
