import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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

    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // Verify user is a receptionist in this clinic
    const { data: receptionistCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', clinicId)
      .eq('user_id', user.id)
      .eq('role', 'receptionist')
      .single()

    if (!receptionistCheck) {
      return NextResponse.json(
        { error: 'Unauthorized: Receptionist access required' },
        { status: 403 }
      )
    }

    // Fetch all analytics data in parallel
    const today = new Date().toISOString().split('T')[0]
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const [
      patientsCount,
      todaysAppointmentsCount,
      weekAppointmentsCount,
      totalAppointmentsCount,
      recentAppointments,
      appointmentsByStatus,
    ] = await Promise.all([
      // Total patients
      supabaseAdmin
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId),

      // Today's appointments
      supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('appointment_date', today)
        .neq('status', 'cancelled'),

      // This week's appointments
      supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('appointment_date', weekStartStr)
        .neq('status', 'cancelled'),

      // Total appointments
      supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId),

      // Recent appointments (last 5)
      supabaseAdmin
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          patient:patients(first_name, last_name, phone),
          doctor:profiles!doctor_id(full_name),
          service:services(name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Appointments by status (upcoming only)
      supabaseAdmin
        .from('appointments')
        .select('status')
        .eq('clinic_id', clinicId)
        .gte('appointment_date', today),
    ])

    // Calculate status counts
    const statusCounts = appointmentsByStatus.data?.reduce(
      (acc: Record<string, number>, apt: any) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1
        return acc
      },
      {}
    ) || {}

    return NextResponse.json({
      stats: {
        total_patients: patientsCount.count || 0,
        todays_appointments: todaysAppointmentsCount.count || 0,
        week_appointments: weekAppointmentsCount.count || 0,
        total_appointments: totalAppointmentsCount.count || 0,
      },
      status_breakdown: {
        scheduled: statusCounts['scheduled'] || 0,
        confirmed: statusCounts['confirmed'] || 0,
        completed: statusCounts['completed'] || 0,
        cancelled: statusCounts['cancelled'] || 0,
      },
      recent_appointments: recentAppointments.data || [],
    })
  } catch (error) {
    console.error('Error fetching receptionist analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
