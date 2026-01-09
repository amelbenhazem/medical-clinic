import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { detectUrgency } from '@/lib/ai/services/appointment-optimizer'

export async function POST(request: NextRequest) {
  try {
    // Vérifier authentification
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notes, symptoms, patient_id } = body

    if (!notes) {
      return NextResponse.json(
        { error: 'Notes are required' },
        { status: 400 }
      )
    }

    // Récupérer l'historique du patient si patient_id fourni
    let patientHistory = ''
    let previousUrgencies: string[] = []

    if (patient_id) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Récupérer les consultations précédentes
      const { data: consultations } = await supabaseAdmin
        .from('consultations')
        .select('symptoms, diagnosis, created_at')
        .eq('patient_id', patient_id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (consultations && consultations.length > 0) {
        patientHistory = consultations
          .map(c => `Consultation ${c.created_at}: ${c.symptoms || ''} - ${c.diagnosis || ''}`)
          .join('; ')
      }

      // Récupérer les rendez-vous précédents avec notes
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('notes, created_at')
        .eq('patient_id', patient_id)
        .not('notes', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (appointments) {
        previousUrgencies = appointments
          .map(a => a.notes)
          .filter(Boolean) as string[]
      }
    }

    // Appeler l'IA pour détecter l'urgence (GRATUIT - Google Gemini)
    const urgencyResult = await detectUrgency({
      notes,
      symptoms,
      patientHistory,
      previousUrgencies
    })

    return NextResponse.json({
      success: true,
      ...urgencyResult
    })
  } catch (error: any) {
    console.error('Error in detect-urgency:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}
