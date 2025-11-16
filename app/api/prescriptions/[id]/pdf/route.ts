import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { generatePrescriptionPDF } from '@/lib/pdf/prescription-generator'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get prescription with related data
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        id,
        medications,
        instructions,
        valid_until,
        created_at,
        patient:patients(
          id,
          first_name,
          last_name,
          date_of_birth,
          phone,
          clinic:clinics(
            id,
            name,
            address,
            phone
          )
        ),
        doctor:profiles!doctor_id(
          id,
          full_name
        )
      `)
      .eq('id', id)
      .single()

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      )
    }

    // Check authorization - user must be the doctor, patient, or staff member
    const isDoctor = user.id === prescription.doctor.id
    const isPatient = prescription.patient.id && (
      await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('id', prescription.patient.id)
        .eq('profile_id', user.id)
        .single()
    ).data

    const isStaff = (
      await supabaseAdmin
        .from('clinic_staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('clinic_id', prescription.patient.clinic.id)
        .single()
    ).data

    if (!isDoctor && !isPatient && !isStaff) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Generate PDF
    const pdfData = {
      prescription_id: prescription.id,
      patient: {
        first_name: prescription.patient.first_name,
        last_name: prescription.patient.last_name,
        date_of_birth: prescription.patient.date_of_birth,
        phone: prescription.patient.phone,
      },
      doctor: {
        full_name: prescription.doctor.full_name,
      },
      clinic: {
        name: prescription.patient.clinic.name,
        address: prescription.patient.clinic.address,
        phone: prescription.patient.clinic.phone,
      },
      medications: prescription.medications,
      instructions: prescription.instructions,
      valid_until: prescription.valid_until,
      created_at: prescription.created_at,
    }

    const pdfBuffer = generatePrescriptionPDF(pdfData)

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="prescription-${prescription.id}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating prescription PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
