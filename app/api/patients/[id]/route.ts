import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

// GET - Get single patient
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

    // Get patient
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', id)
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

    return NextResponse.json({
      patient,
    })
  } catch (error: any) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update patient
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      emergency_contact_name,
      emergency_contact_phone,
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

    // Get patient to check clinic access
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('clinic_id')
      .eq('id', id)
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

    // Update patient using admin client
    const { data: updatedPatient, error: updateError } = await supabaseAdmin
      .from('patients')
      .update({
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email: email || null,
        address: address || null,
        emergency_contact_name: emergency_contact_name || null,
        emergency_contact_phone: emergency_contact_phone || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
    })
  } catch (error: any) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete patient
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

    // Get patient to check clinic access
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('clinic_id')
      .eq('id', id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Verify user has access (admin/owner only for deletion)
    const { data: staffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', patient.clinic_id)
      .eq('user_id', user.id)
      .single()

    const { data: ownerCheck } = await supabaseAdmin
      .from('clinics')
      .select('owner_id')
      .eq('id', patient.clinic_id)
      .eq('owner_id', user.id)
      .single()

    const isAdmin = staffCheck?.role === 'admin'
    const isOwner = ownerCheck?.owner_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can delete patients' },
        { status: 403 }
      )
    }

    // Delete patient using admin client
    const { error: deleteError } = await supabaseAdmin
      .from('patients')
      .delete()
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
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
