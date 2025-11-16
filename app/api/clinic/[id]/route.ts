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

// PATCH - Update clinic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, address, phone, email } = body

    // Get current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is owner or admin of this clinic
    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('owner_id')
      .eq('id', id)
      .single()

    const { data: staffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', id)
      .eq('user_id', user.id)
      .single()

    const isOwner = clinic?.owner_id === user.id
    const isAdmin = staffCheck?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only clinic owners or admins can update clinic information' },
        { status: 403 }
      )
    }

    // Update clinic
    const { data: updatedClinic, error: updateError } = await supabaseAdmin
      .from('clinics')
      .update({
        name,
        address,
        phone,
        email,
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
      clinic: updatedClinic,
    })
  } catch (error: any) {
    console.error('Error updating clinic:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
