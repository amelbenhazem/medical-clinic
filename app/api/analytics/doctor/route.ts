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
    const doctorId = searchParams.get('doctor_id') || user.id

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // Verify user is a doctor in this clinic
    const { data: doctorCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', clinicId)
      .eq('user_id', doctorId)
      .eq('role', 'doctor')
      .single()

    if (!doctorCheck) {
      return NextResponse.json(
        { error: 'Unauthorized: Doctor access required' },
        { status: 403 }
      )
    }

    // Fetch all analytics data in parallel
    const today = new Date().toISOString().split('T')[0]
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const [
      uniquePatientsCount,
      todaysAppointmentsCount,
      weekAppointmentsCount,
      totalConsultationsCount,
      upcomingAppointments,
      appointmentsByStatus,
    ] = await Promise.all([
      // Unique patients seen by this doctor
      supabaseAdmin
        .from('appointments')
        .select('patient_id', { count: 'exact', head: false })
        .eq('clinic_id', clinicId)
        .eq('doctor_id', doctorId)
        .eq('status', 'completed')
        .then(({ data }) => {
          const uniquePatients = new Set(data?.map(apt => apt.patient_id))
          return { count: uniquePatients.size }
        }),

      // Today's appointments
      supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today)
        .neq('status', 'cancelled'),

      // This week's appointments
      supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('doctor_id', doctorId)
        .gte('appointment_date', weekStartStr)
        .neq('status', 'cancelled'),

      // Total consultations
      supabaseAdmin
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId),

      // Upcoming appointments (next 5)
      supabaseAdmin
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          patient:patients(first_name, last_name, phone),
          service:services(name, duration_minutes)
        `)
        .eq('clinic_id', clinicId)
        .eq('doctor_id', doctorId)
        .gte('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5),

      // Appointments by status (upcoming only)
      supabaseAdmin
        .from('appointments')
        .select('status')
        .eq('clinic_id', clinicId)
        .eq('doctor_id', doctorId)
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
        total_patients: uniquePatientsCount.count || 0,
        todays_appointments: todaysAppointmentsCount.count || 0,
        week_appointments: weekAppointmentsCount.count || 0,
        total_consultations: totalConsultationsCount.count || 0,
      },
      status_breakdown: {
        scheduled: statusCounts['scheduled'] || 0,
        confirmed: statusCounts['confirmed'] || 0,
        completed: statusCounts['completed'] || 0,
        cancelled: statusCounts['cancelled'] || 0,
      },
      upcoming_appointments: upcomingAppointments.data || [],
    })
  } catch (error) {
    console.error('Error fetching doctor analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
