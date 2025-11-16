import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Create a Supabase client with service role for admin operations
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

// Helper function to verify user has access to clinic
async function verifyClinicAccess(userId: string, clinicId: string) {
  const { data: staffCheck } = await supabaseAdmin
    .from('clinic_staff')
    .select('role')
    .eq('clinic_id', clinicId)
    .eq('user_id', userId)
    .single()

  return !!staffCheck
}

// GET - Get patients for a clinic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this clinic
    const hasAccess = await verifyClinicAccess(user.id, clinicId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Fetch patients
    const { data: patients, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (patientsError) {
      return NextResponse.json(
        { error: patientsError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      patients: patients || [],
    })
  } catch (error: any) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
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

    // Validate required fields
    if (!clinic_id || !first_name || !last_name || !date_of_birth || !gender || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current user from session
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this clinic
    const hasAccess = await verifyClinicAccess(user.id, clinic_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Create patient using admin client
    const { data: patient, error: insertError } = await supabaseAdmin
      .from('patients')
      .insert({
        clinic_id,
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
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      patient,
    })
  } catch (error: any) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
