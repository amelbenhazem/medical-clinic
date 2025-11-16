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

    // Verify user is admin/owner of this clinic
    const { data: ownerCheck } = await supabaseAdmin
      .from('clinics')
      .select('owner_id')
      .eq('id', clinicId)
      .eq('owner_id', user.id)
      .single()

    const { data: adminCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', clinicId)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!ownerCheck && !adminCheck) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all analytics data in parallel
    const today = new Date().toISOString().split('T')[0]

    const [
      patientsCount,
      staffCount,
      todaysAppointmentsCount,
      totalConsultationsCount,
      recentAppointments,
      appointmentsByStatus,
      monthlyStats,
    ] = await Promise.all([
      // Total patients
      supabaseAdmin
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId),

      // Total staff
      supabaseAdmin
        .from('clinic_staff')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId),

      // Today's appointments
      supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('appointment_date', today)
        .neq('status', 'cancelled'),

      // Total consultations
      supabaseAdmin
        .from('consultations')
        .select(`
          *,
          patient:patients!inner(clinic_id)
        `, { count: 'exact', head: true })
        .eq('patient.clinic_id', clinicId),

      // Recent appointments (last 5)
      supabaseAdmin
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          status,
          patient:patients(first_name, last_name),
          doctor:profiles!doctor_id(full_name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Appointments by status
      supabaseAdmin
        .from('appointments')
        .select('status')
        .eq('clinic_id', clinicId)
        .gte('appointment_date', today),

      // Monthly statistics (last 30 days)
      supabaseAdmin
        .from('appointments')
        .select('appointment_date, status')
        .eq('clinic_id', clinicId)
        .gte(
          'appointment_date',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ),
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
        total_staff: staffCount.count || 0,
        todays_appointments: todaysAppointmentsCount.count || 0,
        total_consultations: totalConsultationsCount.count || 0,
      },
      status_breakdown: {
        scheduled: statusCounts['scheduled'] || 0,
        confirmed: statusCounts['confirmed'] || 0,
        completed: statusCounts['completed'] || 0,
        cancelled: statusCounts['cancelled'] || 0,
      },
      recent_appointments: recentAppointments.data || [],
      monthly_appointments: monthlyStats.data || [],
    })
  } catch (error) {
    console.error('Error fetching admin analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
