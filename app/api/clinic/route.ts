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

// GET - Get user's clinic
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user owns a clinic
    const { data: ownedClinics, error: ownedError } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('owner_id', user.id)
      .limit(1)

    if (ownedError) {
      return NextResponse.json(
        { error: ownedError.message },
        { status: 400 }
      )
    }

    if (ownedClinics && ownedClinics.length > 0) {
      return NextResponse.json({
        clinic: ownedClinics[0],
      })
    }

    // Check if user is staff of any clinic
    const { data: staffRecords, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .limit(1)

    if (staffError) {
      return NextResponse.json(
        { error: staffError.message },
        { status: 400 }
      )
    }

    if (staffRecords && staffRecords.length > 0) {
      const { data: staffClinic, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .select('*')
        .eq('id', staffRecords[0].clinic_id)
        .single()

      if (clinicError) {
        return NextResponse.json(
          { error: clinicError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        clinic: staffClinic,
      })
    }

    // No clinic found
    return NextResponse.json({
      clinic: null,
    })
  } catch (error: any) {
    console.error('Error fetching clinic:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new clinic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, email } = body

    if (!name || !address || !phone || !email) {
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

    // Create clinic
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert({
        name,
        address,
        phone,
        email,
        owner_id: user.id,
      })
      .select()
      .single()

    if (clinicError) {
      return NextResponse.json(
        { error: clinicError.message },
        { status: 400 }
      )
    }

    // Add owner as admin staff
    const { error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .insert({
        clinic_id: clinic.id,
        user_id: user.id,
        role: 'admin',
      })

    if (staffError) {
      // Rollback: delete clinic
      await supabaseAdmin.from('clinics').delete().eq('id', clinic.id)
      return NextResponse.json(
        { error: staffError.message },
        { status: 400 }
      )
    }

    // Update user profile role to admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)

    if (profileError) {
      // Rollback
      await supabaseAdmin.from('clinic_staff').delete().eq('clinic_id', clinic.id)
      await supabaseAdmin.from('clinics').delete().eq('id', clinic.id)
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      clinic,
    })
  } catch (error: any) {
    console.error('Error creating clinic:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
