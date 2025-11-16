import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET - Get current patient's information
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

    // Find patient record by profile_id
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient record not found' },
        { status: 404 }
      )
    }

    // Fetch upcoming appointments
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id(id, full_name),
        service:service_id(id, name, duration_minutes)
      `)
      .eq('patient_id', patient.id)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5)

    // Fetch recent consultations count
    const { count: consultationsCount, error: consultationsError } = await supabaseAdmin
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patient.id)

    return NextResponse.json({
      patient,
      appointments: appointments || [],
      consultations_count: consultationsCount || 0,
    })
  } catch (error) {
    console.error('Error fetching patient data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
