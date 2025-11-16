import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET - Get users available for linking (not already linked to patients)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get all patients with profile_id (already linked)
    const { data: linkedPatients, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select('profile_id')
      .not('profile_id', 'is', null)

    if (patientsError) {
      return NextResponse.json(
        { error: 'Failed to fetch patients' },
        { status: 500 }
      )
    }

    // Get all staff members (we don't want to link them as patients)
    const { data: staffMembers, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .select('user_id')

    if (staffError) {
      return NextResponse.json(
        { error: 'Failed to fetch staff' },
        { status: 500 }
      )
    }

    // Create sets of linked user IDs and staff IDs
    const linkedUserIds = new Set(linkedPatients?.map(p => p.profile_id) || [])
    const staffUserIds = new Set(staffMembers?.map(s => s.user_id) || [])

    // Filter users: not linked to patients and not staff members
    const availableUsers = authUsers.users
      .filter(authUser =>
        !linkedUserIds.has(authUser.id) &&
        !staffUserIds.has(authUser.id)
      )
      .map(authUser => ({
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
      }))

    return NextResponse.json({
      users: availableUsers,
    })
  } catch (error) {
    console.error('Error fetching available users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
