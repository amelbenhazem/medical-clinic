import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'consultation_ready'
  | 'document_uploaded'
  | 'general'

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  relatedId?: string
) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_id: relatedId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createNotification:', error)
    return null
  }
}

export async function notifyAppointmentCreated(
  patientProfileId: string,
  appointmentId: string,
  doctorName: string,
  appointmentDate: string,
  startTime: string
) {
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return createNotification(
    patientProfileId,
    'Appointment Scheduled',
    `Your appointment with Dr. ${doctorName} has been scheduled for ${formattedDate} at ${formattedTime}.`,
    'appointment_confirmed',
    appointmentId
  )
}

export async function notifyAppointmentConfirmed(
  patientProfileId: string,
  appointmentId: string,
  doctorName: string,
  appointmentDate: string,
  startTime: string
) {
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return createNotification(
    patientProfileId,
    'Appointment Confirmed',
    `Your appointment with Dr. ${doctorName} on ${formattedDate} at ${formattedTime} has been confirmed.`,
    'appointment_confirmed',
    appointmentId
  )
}

export async function notifyAppointmentCancelled(
  patientProfileId: string,
  appointmentId: string,
  doctorName: string,
  appointmentDate: string
) {
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return createNotification(
    patientProfileId,
    'Appointment Cancelled',
    `Your appointment with Dr. ${doctorName} on ${formattedDate} has been cancelled.`,
    'appointment_cancelled',
    appointmentId
  )
}

export async function notifyConsultationReady(
  patientProfileId: string,
  consultationId: string,
  doctorName: string
) {
  return createNotification(
    patientProfileId,
    'Consultation Notes Ready',
    `Dr. ${doctorName} has added notes to your consultation. You can now view them in your medical records.`,
    'consultation_ready',
    consultationId
  )
}

export async function notifyDocumentUploaded(
  patientProfileId: string,
  documentId: string,
  documentType: string,
  fileName: string
) {
  return createNotification(
    patientProfileId,
    'New Document Uploaded',
    `A new ${documentType.replace('_', ' ')} has been uploaded: ${fileName}`,
    'document_uploaded',
    documentId
  )
}
