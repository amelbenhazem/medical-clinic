import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { suggestOptimalSlots, detectUrgency } from '@/lib/ai/services/appointment-optimizer'

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
    const {
      patient_id,
      doctor_id,
      service_id,
      date,
      notes = '',
      available_slots
    } = body

    if (!patient_id || !doctor_id || !service_id || !date || !available_slots || available_slots.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Récupérer les informations nécessaires
    const [patientData, doctorData, serviceData] = await Promise.all([
      supabaseAdmin
        .from('patients')
        .select('first_name, last_name')
        .eq('id', patient_id)
        .single(),
      supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', doctor_id)
        .single(),
      supabaseAdmin
        .from('services')
        .select('name, duration_minutes')
        .eq('id', service_id)
        .single()
    ])

    if (!patientData.data || !doctorData.data || !serviceData.data) {
      return NextResponse.json(
        { error: 'Invalid patient, doctor, or service' },
        { status: 400 }
      )
    }

    // Récupérer l'historique du patient
    const { data: consultations } = await supabaseAdmin
      .from('consultations')
      .select('created_at, symptoms, diagnosis')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('start_time, end_time, service:services(duration_minutes)')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculer la durée moyenne
    const avgDuration = appointments && appointments.length > 0
      ? appointments.reduce((sum, apt) => {
          const duration = Array.isArray(apt.service) 
            ? apt.service[0]?.duration_minutes 
            : apt.service?.duration_minutes
          return sum + (duration || 30)
        }, 0) / appointments.length
      : serviceData.data.duration_minutes || 30

    // DÉTECTER L'URGENCE D'ABORD (GRATUIT - Google Gemini)
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    let urgencyReason = ''

    try {
      const urgencyResult = await detectUrgency({
        notes,
        patientHistory: consultations?.map(c => `${c.symptoms || ''} ${c.diagnosis || ''}`).join('; ') || ''
      })
      urgencyLevel = urgencyResult.level
      urgencyReason = urgencyResult.reason
    } catch (error) {
      console.error('Error detecting urgency:', error)
      // Continue avec niveau moyen par défaut
    }

    // Appeler l'IA pour suggérer les créneaux optimaux (GRATUIT - Google Gemini)
    const suggestions = await suggestOptimalSlots({
      patientId: patient_id,
      patientName: `${patientData.data.first_name} ${patientData.data.last_name}`,
      doctorId: doctor_id,
      doctorName: doctorData.data.full_name || 'Doctor',
      serviceId: service_id,
      serviceName: serviceData.data.name || 'Service',
      serviceDuration: serviceData.data.duration_minutes || 30,
      date,
      notes,
      availableSlots: available_slots,
      urgencyLevel, // Passer le niveau d'urgence détecté
      patientHistory: {
        previousAppointments: consultations?.length || 0,
        averageDuration: avgDuration,
        commonIssues: consultations?.map(c => c.symptoms || '').filter(Boolean) || []
      }
    })

    return NextResponse.json({
      success: true,
      urgency: urgencyLevel,
      urgency_reason: urgencyReason,
      ...suggestions
    })
  } catch (error: any) {
    console.error('Error in suggest-slots:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}
