import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeClinicUrgencies } from '@/lib/ai/services/appointment-optimizer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Vérifier authentification
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clinic_id, date } = body

    if (!clinic_id || !date) {
      return NextResponse.json(
        { error: 'clinic_id and date are required' },
        { status: 400 }
      )
    }

    // Vérifier l'accès à la clinique
    const { data: staffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('clinic_id', clinic_id)
      .eq('user_id', user.id)
      .single()

    if (!staffCheck) {
      return NextResponse.json(
        { error: 'Access denied to this clinic' },
        { status: 403 }
      )
    }

    // Récupérer tous les rendez-vous de la clinique pour cette date
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        start_time,
        notes,
        patient:patients(id, first_name, last_name),
        doctor:profiles!appointments_doctor_id_fkey(id, full_name)
      `)
      .eq('clinic_id', clinic_id)
      .eq('appointment_date', date)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        urgentAppointments: [],
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      })
    }

    // Préparer les données pour l'IA
    const appointmentsData = appointments.map(apt => {
      const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient
      const doctor = Array.isArray(apt.doctor) ? apt.doctor[0] : apt.doctor
      return {
        id: apt.id,
        patient: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
        doctor: doctor?.full_name || 'Unknown',
        time: apt.start_time,
        notes: apt.notes || ''
      }
    })

    // Appeler l'IA pour analyser les urgences (GRATUIT - Google Gemini)
    const analysis = await analyzeClinicUrgencies({
      clinicId: clinic_id,
      date,
      appointments: appointmentsData
    })

    return NextResponse.json({
      success: true,
      ...analysis
    })
  } catch (error: any) {
    console.error('Error in analyze-urgencies:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}
