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

// PATCH - Update service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, duration_minutes } = body

    // Get current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get service to check clinic access
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('clinic_id')
      .eq('id', id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this clinic
    const hasAccess = await verifyClinicAccess(user.id, service.clinic_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this clinic' },
        { status: 403 }
      )
    }

    // Update service
    const { data: updatedService, error: updateError } = await supabaseAdmin
      .from('services')
      .update({
        name,
        description: description || null,
        duration_minutes,
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
      service: updatedService,
    })
  } catch (error: any) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete service
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

    // Get service to check clinic access
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('clinic_id')
      .eq('id', id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Verify user has access (admin/owner only for deletion)
    const { data: staffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', service.clinic_id)
      .eq('user_id', user.id)
      .single()

    const { data: ownerCheck } = await supabaseAdmin
      .from('clinics')
      .select('owner_id')
      .eq('id', service.clinic_id)
      .eq('owner_id', user.id)
      .single()

    const isAdmin = staffCheck?.role === 'admin'
    const isOwner = ownerCheck?.owner_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can delete services' },
        { status: 403 }
      )
    }

    // Delete service
    const { error: deleteError } = await supabaseAdmin
      .from('services')
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
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
