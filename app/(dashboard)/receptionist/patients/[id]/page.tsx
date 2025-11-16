'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  User,
  AlertCircle,
  Edit,
  Plus,
  FileText,
  Clock,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  Pill,
} from 'lucide-react'
import { format } from 'date-fns'
import type { Tables } from '@/types/database.types'

type Patient = Tables<'patients'>

type MedicalHistory = {
  id: string
  allergies: string[]
  chronic_conditions: string[]
  past_surgeries: string[]
  family_history: string | null
  blood_type: string | null
  notes: string | null
}

type Appointment = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
  patient: { first_name: string; last_name: string }
  doctor: { full_name: string }
  service: { name: string }
}

type Consultation = {
  id: string
  diagnosis: string | null
  symptoms: string | null
  treatment_plan: string | null
  created_at: string
  doctor: { full_name: string }
  prescriptions: Array<{
    id: string
    medications: Array<{
      name: string
      dosage: string
      frequency: string
    }>
  }>
}

type Document = {
  id: string
  file_name: string
  document_type: string
  file_size: number
  uploaded_at: string
  description: string | null
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialogs
  const [isMedicalHistoryDialogOpen, setIsMedicalHistoryDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  // Medical History Form
  const [medicalHistoryForm, setMedicalHistoryForm] = useState({
    allergies: '',
    chronic_conditions: '',
    past_surgeries: '',
    family_history: '',
    blood_type: '',
    notes: '',
  })

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    document_type: 'report',
    description: '',
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadAllData()
    }
  }, [params.id])

  const loadAllData = async () => {
    if (!params.id || typeof params.id !== 'string') return

    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadPatient(),
        loadMedicalHistory(),
        loadAppointments(),
        loadConsultations(),
        loadDocuments(),
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadPatient = async () => {
    const response = await fetch(`/api/patients/${params.id}`)
    const data = await response.json()
    if (response.ok) {
      setPatient(data.patient)
    } else {
      throw new Error(data.error || 'Failed to load patient')
    }
  }

  const loadMedicalHistory = async () => {
    const response = await fetch(`/api/medical-history?patient_id=${params.id}`)
    const data = await response.json()
    if (response.ok && data.medical_history) {
      setMedicalHistory(data.medical_history)
      setMedicalHistoryForm({
        allergies: data.medical_history.allergies?.join(', ') || '',
        chronic_conditions: data.medical_history.chronic_conditions?.join(', ') || '',
        past_surgeries: data.medical_history.past_surgeries?.join(', ') || '',
        family_history: data.medical_history.family_history || '',
        blood_type: data.medical_history.blood_type || '',
        notes: data.medical_history.notes || '',
      })
    }
  }

  const loadAppointments = async () => {
    const response = await fetch(`/api/appointments?patient_id=${params.id}`)
    const data = await response.json()
    if (response.ok) {
      setAppointments(data.appointments || [])
    }
  }

  const loadConsultations = async () => {
    const response = await fetch(`/api/consultations?patient_id=${params.id}`)
    const data = await response.json()
    if (response.ok) {
      setConsultations(data.consultations || [])
    }
  }

  const loadDocuments = async () => {
    const response = await fetch(`/api/documents?patient_id=${params.id}`)
    const data = await response.json()
    if (response.ok) {
      setDocuments(data.documents || [])
    }
  }

  const handleSaveMedicalHistory = async () => {
    if (!patient) return

    try {
      const payload = {
        patient_id: patient.id,
        allergies: medicalHistoryForm.allergies
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        chronic_conditions: medicalHistoryForm.chronic_conditions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        past_surgeries: medicalHistoryForm.past_surgeries
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        family_history: medicalHistoryForm.family_history || null,
        blood_type: medicalHistoryForm.blood_type || null,
        notes: medicalHistoryForm.notes || null,
      }

      let response
      if (medicalHistory?.id) {
        // Update existing
        response = await fetch(`/api/medical-history/${medicalHistory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new
        response = await fetch('/api/medical-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (response.ok) {
        setIsMedicalHistoryDialogOpen(false)
        loadMedicalHistory()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save medical history')
      }
    } catch (error) {
      alert('Error saving medical history')
    }
  }

  const handleUploadDocument = async () => {
    if (!uploadForm.file || !patient) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('patient_id', patient.id)
      formData.append('document_type', uploadForm.document_type)
      if (uploadForm.description) {
        formData.append('description', uploadForm.description)
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setIsUploadDialogOpen(false)
        setUploadForm({ file: null, document_type: 'report', description: '' })
        loadDocuments()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to upload document')
      }
    } catch (error) {
      alert('Error uploading document')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      const data = await response.json()
      if (response.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      }
    } catch (error) {
      alert('Error downloading document')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadDocuments()
      }
    } catch (error) {
      alert('Error deleting document')
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-neutral-100 text-neutral-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading patient details...</div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Link href="/receptionist/patients">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Patient not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/receptionist/patients">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>
        </Link>
        <Button onClick={() => router.push(`/receptionist/patients`)}>
          Edit Patient
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Patient Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {patient.first_name} {patient.last_name}
                </CardTitle>
                <CardDescription className="mt-2">
                  Patient ID: {patient.id.slice(0, 8)}...
                </CardDescription>
              </div>
              <Badge variant="outline" className="capitalize">
                {patient.gender}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-neutral-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm text-neutral-600">{formatDate(patient.date_of_birth)}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {calculateAge(patient.date_of_birth)} years old
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-neutral-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm text-neutral-600">{patient.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-neutral-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-neutral-600">
                    {patient.email || <span className="text-neutral-400">Not provided</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-neutral-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-neutral-600">
                    {patient.address || <span className="text-neutral-400">Not provided</span>}
                  </p>
                </div>
              </div>
            </div>

            {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-neutral-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Emergency Contact</p>
                    <p className="text-sm text-neutral-600">
                      {patient.emergency_contact_name && <span>{patient.emergency_contact_name}</span>}
                      {patient.emergency_contact_name && patient.emergency_contact_phone && <span> - </span>}
                      {patient.emergency_contact_phone && <span>{patient.emergency_contact_phone}</span>}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator />
            <div className="text-xs text-neutral-500">Registered on {formatDate(patient.created_at)}</div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/receptionist/appointments">
              <Button className="w-full" variant="outline">
                Book Appointment
              </Button>
            </Link>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setIsMedicalHistoryDialogOpen(true)}
            >
              View History
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Medical History Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Patient's medical history and conditions</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsMedicalHistoryDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {medicalHistory ? 'Edit' : 'Add'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!medicalHistory ? (
            <p className="text-sm text-neutral-600">No medical history recorded yet</p>
          ) : (
            <div className="space-y-4">
              {medicalHistory.allergies && medicalHistory.allergies.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-medium text-red-800">Allergies</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.allergies.map((allergy, index) => (
                      <Badge key={index} className="bg-red-100 text-red-800">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {medicalHistory.blood_type && (
                  <div>
                    <p className="text-sm font-medium mb-1">Blood Type</p>
                    <Badge variant="secondary">{medicalHistory.blood_type}</Badge>
                  </div>
                )}

                {medicalHistory.chronic_conditions && medicalHistory.chronic_conditions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Chronic Conditions</p>
                    <div className="flex flex-wrap gap-1">
                      {medicalHistory.chronic_conditions.map((condition, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {medicalHistory.past_surgeries && medicalHistory.past_surgeries.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Past Surgeries</p>
                    <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                      {medicalHistory.past_surgeries.map((surgery, index) => (
                        <li key={index} className="text-xs">
                          {surgery}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {medicalHistory.family_history && (
                <div>
                  <p className="text-sm font-medium mb-1">Family History</p>
                  <p className="text-sm text-neutral-600">{medicalHistory.family_history}</p>
                </div>
              )}

              {medicalHistory.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Additional Notes</p>
                  <p className="text-sm text-neutral-600">{medicalHistory.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>Upcoming and past appointments ({appointments.length})</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-neutral-600">No appointments scheduled</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{appointment.service.name}</p>
                      <Badge className={getStatusColor(appointment.status)} variant="secondary">
                        {appointment.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-neutral-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {appointment.doctor.full_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(new Date(`2000-01-01T${appointment.start_time}`), 'h:mm a')} -{' '}
                        {format(new Date(`2000-01-01T${appointment.end_time}`), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {appointments.length > 5 && (
                <p className="text-xs text-neutral-500 text-center pt-2">
                  Showing 5 of {appointments.length} appointments
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Records</CardTitle>
          <CardDescription>Consultation history ({consultations.length})</CardDescription>
        </CardHeader>
        <CardContent>
          {consultations.length === 0 ? (
            <p className="text-sm text-neutral-600">No consultations yet</p>
          ) : (
            <div className="space-y-3">
              {consultations.slice(0, 5).map((consultation) => (
                <div key={consultation.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{format(new Date(consultation.created_at), 'MMMM dd, yyyy')}</p>
                      <p className="text-xs text-neutral-500">Dr. {consultation.doctor.full_name}</p>
                    </div>
                    {consultation.prescriptions.length > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Pill className="h-3 w-3 mr-1" />
                        {consultation.prescriptions.length} Rx
                      </Badge>
                    )}
                  </div>
                  {consultation.diagnosis && (
                    <div>
                      <p className="text-xs font-medium text-neutral-700">Diagnosis</p>
                      <p className="text-xs text-neutral-600">{consultation.diagnosis}</p>
                    </div>
                  )}
                  {consultation.treatment_plan && (
                    <div>
                      <p className="text-xs font-medium text-neutral-700">Treatment</p>
                      <p className="text-xs text-neutral-600">{consultation.treatment_plan}</p>
                    </div>
                  )}
                </div>
              ))}
              {consultations.length > 5 && (
                <p className="text-xs text-neutral-500 text-center pt-2">
                  Showing 5 of {consultations.length} consultations
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Medical documents and files ({documents.length})</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-neutral-600">No documents uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{document.file_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {document.document_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-neutral-500">{formatFileSize(document.file_size)}</span>
                      <span className="text-xs text-neutral-500">
                        {format(new Date(document.uploaded_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {document.description && (
                      <p className="text-xs text-neutral-600 mt-1">{document.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleDownloadDocument(document.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteDocument(document.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical History Dialog */}
      <Dialog open={isMedicalHistoryDialogOpen} onOpenChange={setIsMedicalHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{medicalHistory ? 'Edit' : 'Add'} Medical History</DialogTitle>
            <DialogDescription>Update patient's medical history and conditions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="allergies">Allergies (comma-separated)</Label>
              <Input
                id="allergies"
                value={medicalHistoryForm.allergies}
                onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, allergies: e.target.value })}
                placeholder="e.g., Penicillin, Peanuts, Latex"
              />
            </div>
            <div>
              <Label htmlFor="blood_type">Blood Type</Label>
              <Input
                id="blood_type"
                value={medicalHistoryForm.blood_type}
                onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, blood_type: e.target.value })}
                placeholder="e.g., A+, O-, AB+"
              />
            </div>
            <div>
              <Label htmlFor="chronic_conditions">Chronic Conditions (comma-separated)</Label>
              <Input
                id="chronic_conditions"
                value={medicalHistoryForm.chronic_conditions}
                onChange={(e) =>
                  setMedicalHistoryForm({ ...medicalHistoryForm, chronic_conditions: e.target.value })
                }
                placeholder="e.g., Diabetes, Hypertension"
              />
            </div>
            <div>
              <Label htmlFor="past_surgeries">Past Surgeries (comma-separated)</Label>
              <Input
                id="past_surgeries"
                value={medicalHistoryForm.past_surgeries}
                onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, past_surgeries: e.target.value })}
                placeholder="e.g., Appendectomy, Knee Surgery"
              />
            </div>
            <div>
              <Label htmlFor="family_history">Family History</Label>
              <Textarea
                id="family_history"
                value={medicalHistoryForm.family_history}
                onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, family_history: e.target.value })}
                placeholder="Relevant family medical history"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={medicalHistoryForm.notes}
                onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, notes: e.target.value })}
                placeholder="Any other relevant medical information"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMedicalHistoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMedicalHistory}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a medical document for this patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              />
            </div>
            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <select
                id="document_type"
                value={uploadForm.document_type}
                onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="lab_result">Lab Result</option>
                <option value="scan">Scan/Imaging</option>
                <option value="prescription">Prescription</option>
                <option value="report">Report</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Brief description of the document"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={!uploadForm.file || uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
