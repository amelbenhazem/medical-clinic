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

// GET - Get doctor availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctor_id')

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctor_id is required' },
        { status: 400 }
      )
    }

    const { data: availability, error } = await supabaseAdmin
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      availability: availability || [],
    })
  } catch (error: any) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update doctor availability
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { doctor_id, availability } = body

    // Verify user is the doctor or is staff
    if (user.id !== doctor_id) {
      const { data: staffCheck } = await supabaseAdmin
        .from('clinic_staff')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!staffCheck || staffCheck.role === 'receptionist') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }

    // Delete existing availability for this doctor
    await supabaseAdmin
      .from('doctor_availability')
      .delete()
      .eq('doctor_id', doctor_id)

    // Insert new availability
    if (availability && availability.length > 0) {
      const { data: newAvailability, error: insertError } = await supabaseAdmin
        .from('doctor_availability')
        .insert(
          availability.map((slot: any) => ({
            doctor_id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available ?? true,
          }))
        )
        .select()

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        availability: newAvailability,
      })
    }

    return NextResponse.json({
      success: true,
      availability: [],
    })
  } catch (error: any) {
    console.error('Error updating availability:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
