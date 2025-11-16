import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get document record
    const { data: document, error: docError } = await supabaseAdmin
      .from('medical_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this document
    const { data: patientCheck } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('profile_id', user.id)
      .eq('id', document.patient_id)
      .single()

    const { data: staffCheck } = await supabaseAdmin
      .from('clinic_staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!patientCheck && !staffCheck) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get signed URL for download
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('medical-documents')
      .createSignedUrl(document.storage_path, 300) // 5 minutes

    if (urlError || !signedUrlData) {
      console.error('Error creating signed URL:', urlError)
      return NextResponse.json(
        { error: 'Failed to generate download link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      document,
      downloadUrl: signedUrlData.signedUrl,
    })
  } catch (error) {
    console.error('Error in document GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get document record
    const { data: document, error: docError } = await supabaseAdmin
      .from('medical_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if user uploaded this document or is admin
    if (document.uploaded_by !== user.id) {
      const { data: adminCheck } = await supabaseAdmin
        .from('clinic_staff')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (!adminCheck) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only delete documents you uploaded' },
          { status: 403 }
        )
      }
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('medical-documents')
      .remove([document.storage_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
    }

    // Delete database record
    const { error: deleteError } = await supabaseAdmin
      .from('medical_documents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting document record:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in document DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
