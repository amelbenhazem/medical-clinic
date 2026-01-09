import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { optimizeDoctorSchedule, detectUrgency } from '@/lib/ai/services/appointment-optimizer'

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
    const { doctor_id, date } = body

    if (!doctor_id || !date) {
      return NextResponse.json(
        { error: 'doctor_id and date are required' },
        { status: 400 }
      )
    }

    // Récupérer les informations du médecin
    const { data: doctorData } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', doctor_id)
      .single()

    if (!doctorData) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }

    // Récupérer tous les rendez-vous du médecin pour cette date
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        notes,
        patient:patients(id, first_name, last_name),
        service:services(duration_minutes)
      `)
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', date)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        urgencyRanking: [],
        efficiency: {
          currentGaps: 0,
          suggestedGaps: 0,
          improvement: 'No appointments to optimize'
        }
      })
    }

    // Détecter l'urgence pour chaque rendez-vous
    const appointmentsWithUrgency = await Promise.all(
      appointments.map(async (apt) => {
        const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient
        const service = Array.isArray(apt.service) ? apt.service[0] : apt.service
        const duration = service?.duration_minutes || 30

        let urgency = 'medium'
        try {
          const urgencyResult = await detectUrgency({
            notes: apt.notes || ''
          })
          urgency = urgencyResult.level
        } catch (error) {
          console.error('Error detecting urgency for appointment:', error)
        }

        return {
          id: apt.id,
          time: apt.start_time,
          duration,
          patient: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
          notes: apt.notes || '',
          urgency
        }
      })
    )

    // Récupérer les créneaux disponibles
    const { data: availability } = await supabaseAdmin
      .from('doctor_availability')
      .select('start_time, end_time')
      .eq('doctor_id', doctor_id)
      .eq('day_of_week', new Date(date).getDay())
      .eq('is_available', true)
      .single()

    // Générer les créneaux disponibles (simplifié)
    const availableSlots: string[] = []
    if (availability) {
      const start = availability.start_time.split(':').map(Number)
      const end = availability.end_time.split(':').map(Number)
      const startMinutes = start[0] * 60 + start[1]
      const endMinutes = end[0] * 60 + end[1]

      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        availableSlots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`)
      }
    }

    // Appeler l'IA pour optimiser le planning (GRATUIT - Google Gemini)
    const optimization = await optimizeDoctorSchedule({
      doctorId: doctor_id,
      doctorName: doctorData.full_name || 'Doctor',
      date,
      appointments: appointmentsWithUrgency,
      availableSlots
    })

    return NextResponse.json({
      success: true,
      ...optimization
    })
  } catch (error: any) {
    console.error('Error in optimize-schedule:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}
