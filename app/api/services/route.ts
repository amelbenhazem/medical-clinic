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
  // Check if user is staff
  const { data: staffCheck } = await supabaseAdmin
    .from('clinic_staff')
    .select('role')
    .eq('clinic_id', clinicId)
    .eq('user_id', userId)
    .single()

  if (staffCheck) return true

  // Check if user is a patient in this clinic
  const { data: patientCheck } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('profile_id', userId)
    .single()

  return !!patientCheck
}

// GET - Get services for a clinic
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

    // Fetch services
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name')

    if (servicesError) {
      return NextResponse.json(
        { error: servicesError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      services: services || [],
    })
  } catch (error: any) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, name, description, duration_minutes } = body

    if (!clinic_id || !name || !duration_minutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    const hasAccess = await verifyClinicAccess(user.id, clinic_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Create service
    const { data: service, error: insertError } = await supabaseAdmin
      .from('services')
      .insert({
        clinic_id,
        name,
        description: description || null,
        duration_minutes,
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
      service,
    })
  } catch (error: any) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
