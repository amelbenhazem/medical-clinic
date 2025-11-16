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

// DELETE - Remove staff member
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

    // Get staff member to check clinic and role
    const { data: staffMember, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('id', id)
      .single()

    if (staffError || !staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Verify user is owner or admin of this clinic
    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('owner_id')
      .eq('id', staffMember.clinic_id)
      .single()

    const { data: userStaffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', staffMember.clinic_id)
      .eq('user_id', user.id)
      .single()

    const isOwner = clinic?.owner_id === user.id
    const isAdmin = userStaffCheck?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only clinic owners or admins can remove staff' },
        { status: 403 }
      )
    }

    // Prevent removing admin role
    if (staffMember.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove admin staff members' },
        { status: 400 }
      )
    }

    // Delete staff member
    const { error: deleteError } = await supabaseAdmin
      .from('clinic_staff')
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
    console.error('Error removing staff:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
