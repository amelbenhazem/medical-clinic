import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff (only staff can upload)
    const { data: staffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!staffCheck) {
      return NextResponse.json(
        { error: 'Unauthorized: Only staff can upload documents' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const patientId = formData.get('patient_id') as string
    const consultationId = formData.get('consultation_id') as string | null
    const documentType = formData.get('document_type') as string
    const description = formData.get('description') as string | null

    if (!file || !patientId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate document type
    const validTypes = ['lab_result', 'scan', 'prescription', 'report', 'other']
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    // Create storage path: patient_id/filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${file.name}`
    const storagePath = `${patientId}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('medical-documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Create database record
    const { data: document, error: dbError } = await supabaseAdmin
      .from('medical_documents')
      .insert({
        patient_id: patientId,
        uploaded_by: user.id,
        consultation_id: consultationId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        document_type: documentType,
        description,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error creating document record:', dbError)
      // Delete uploaded file
      await supabaseAdmin.storage
        .from('medical-documents')
        .remove([storagePath])

      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Error in document upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
