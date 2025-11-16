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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name, phone, role, clinic_id } = body

    // Validate required fields
    if (!email || !password || !full_name || !role || !clinic_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the requesting user is an admin in this clinic
    const supabase = await createServerClient()

    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or owner of this clinic
    const { data: staffCheck, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', clinic_id)
      .eq('user_id', user.id)
      .single()

    const { data: ownerCheck } = await supabaseAdmin
      .from('clinics')
      .select('owner_id')
      .eq('id', clinic_id)
      .eq('owner_id', user.id)
      .single()

    const isAdmin = staffCheck?.role === 'admin'
    const isOwner = ownerCheck?.owner_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can invite staff' },
        { status: 403 }
      )
    }

    // Create auth user using admin client
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
      },
    })

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        phone,
        role,
      })

    if (profileError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    // Add to clinic staff
    const { error: staffInsertError } = await supabaseAdmin
      .from('clinic_staff')
      .insert({
        clinic_id,
        user_id: authData.user.id,
        role,
      })

    if (staffInsertError) {
      // Rollback: delete profile and auth user
      await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: staffInsertError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error: any) {
    console.error('Error inviting staff:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
