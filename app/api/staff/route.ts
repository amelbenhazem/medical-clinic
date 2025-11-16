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

// GET - Get staff members for a clinic
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

    // Verify user has access to this clinic (staff, owner, or patient)
    const { data: staffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', clinicId)
      .eq('user_id', user.id)
      .single()

    const { data: ownerCheck } = await supabaseAdmin
      .from('clinics')
      .select('owner_id')
      .eq('id', clinicId)
      .eq('owner_id', user.id)
      .single()

    const { data: patientCheck } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('profile_id', user.id)
      .single()

    if (!staffCheck && !ownerCheck && !patientCheck) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Get optional role filter
    const role = searchParams.get('role')

    // Build query to fetch staff members for this clinic
    let query = supabaseAdmin
      .from('clinic_staff')
      .select(`
        id,
        user_id,
        role,
        created_at,
        profiles:user_id (
          full_name,
          phone
        )
      `)
      .eq('clinic_id', clinicId)

    // Apply role filter if provided
    if (role) {
      query = query.eq('role', role)
    }

    const { data: staff, error: staffError } = await query

    if (staffError) {
      return NextResponse.json(
        { error: staffError.message },
        { status: 400 }
      )
    }

    // Format the response to make it easier to use
    const formattedStaff = staff?.map(s => ({
      id: s.profiles?.full_name ? s.user_id : s.id,
      full_name: s.profiles?.full_name || 'Unknown',
      role: s.role,
      phone: s.profiles?.phone,
      created_at: s.created_at,
    })) || []

    return NextResponse.json({
      staff: formattedStaff,
    })
  } catch (error: any) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
