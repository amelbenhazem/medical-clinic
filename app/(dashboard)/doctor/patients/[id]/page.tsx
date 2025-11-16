'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MedicalHistoryForm } from '@/components/forms/medical-history-form'
import { User, Calendar, FileText, Pill, AlertTriangle, Edit, Download, FolderOpen } from 'lucide-react'
import { format } from 'date-fns'

type Patient = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}

type MedicalHistory = {
  id: string
  allergies: string[]
  chronic_conditions: string[]
  past_surgeries: string[]
  family_history: string | null
  blood_type: string | null
  notes: string | null
}

type Consultation = {
  id: string
  diagnosis: string | null
  symptoms: string | null
  examination_notes: string | null
  treatment_plan: string | null
  follow_up_date: string | null
  created_at: string
  appointment: {
    appointment_date: string
    start_time: string
  } | null
  prescriptions: any[]
}

type Document = {
  id: string
  file_name: string
  file_type: string
  file_size: number
  document_type: string
  description: string | null
  uploaded_at: string
  uploaded_by: {
    full_name: string
  }
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [isMedicalHistoryDialogOpen, setIsMedicalHistoryDialogOpen] = useState(false)

  useEffect(() => {
    loadPatientData()
  }, [id])

  const loadPatientData = async () => {
    setLoading(true)

    try {
      // Fetch patient details
      const patientRes = await fetch(`/api/patients/${id}`)
      const patientData = await patientRes.json()

      if (patientRes.ok) {
        setPatient(patientData.patient)
      }

      // Fetch medical history
      const historyRes = await fetch(`/api/medical-history?patient_id=${id}`)
      const historyData = await historyRes.json()

      if (historyRes.ok) {
        setMedicalHistory(historyData.medical_history)
      }

      // Fetch consultations
      const consultationsRes = await fetch(`/api/consultations?patient_id=${id}`)
      const consultationsData = await consultationsRes.json()

      if (consultationsRes.ok) {
        setConsultations(consultationsData.consultations || [])
      }

      // Fetch documents
      const documentsRes = await fetch(`/api/documents?patient_id=${id}`)
      const documentsData = await documentsRes.json()

      if (documentsRes.ok) {
        setDocuments(documentsData.documents || [])
      }
    } catch (error) {
      console.error('Error loading patient data:', error)
    } finally {
      setLoading(false)
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      const data = await response.json()

      if (response.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      } else {
        alert(data.error || 'Failed to download document')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document')
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lab_result: 'Lab Result',
      scan: 'Scan',
      prescription: 'Prescription',
      report: 'Report',
      other: 'Other',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading patient details...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Patient not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {patient.first_name} {patient.last_name}
          </h2>
          <p className="text-neutral-600">
            {calculateAge(patient.date_of_birth)} years old • {patient.gender}
          </p>
        </div>
      </div>

      {/* Medical History Alert */}
      {medicalHistory?.allergies && medicalHistory.allergies.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {medicalHistory.allergies.map((allergy, index) => (
                <Badge key={index} className="bg-red-100 text-red-800">
                  {allergy}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-neutral-500">Date of Birth</p>
              <p className="font-medium">{format(new Date(patient.date_of_birth), 'MMMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-neutral-500">Phone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
            {patient.email && (
              <div>
                <p className="text-neutral-500">Email</p>
                <p className="font-medium">{patient.email}</p>
              </div>
            )}
            {patient.address && (
              <div>
                <p className="text-neutral-500">Address</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            )}
            {patient.emergency_contact_name && (
              <div className="pt-2 border-t">
                <p className="text-neutral-500">Emergency Contact</p>
                <p className="font-medium">{patient.emergency_contact_name}</p>
                <p className="text-xs text-neutral-500">{patient.emergency_contact_phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Medical History</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsMedicalHistoryDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                {medicalHistory ? 'Edit' : 'Add'} History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!medicalHistory ? (
              <p className="text-sm text-neutral-600">No medical history recorded yet</p>
            ) : (
              <div className="space-y-4 text-sm">
                {medicalHistory.blood_type && (
                  <div>
                    <p className="font-medium mb-1">Blood Type</p>
                    <Badge variant="secondary">{medicalHistory.blood_type}</Badge>
                  </div>
                )}

                {medicalHistory.chronic_conditions && medicalHistory.chronic_conditions.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Chronic Conditions</p>
                    <div className="flex flex-wrap gap-1">
                      {medicalHistory.chronic_conditions.map((condition, index) => (
                        <Badge key={index} variant="secondary">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {medicalHistory.past_surgeries && medicalHistory.past_surgeries.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Past Surgeries</p>
                    <ul className="list-disc list-inside text-neutral-600 space-y-1">
                      {medicalHistory.past_surgeries.map((surgery, index) => (
                        <li key={index}>{surgery}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {medicalHistory.family_history && (
                  <div>
                    <p className="font-medium mb-1">Family History</p>
                    <p className="text-neutral-600">{medicalHistory.family_history}</p>
                  </div>
                )}

                {medicalHistory.notes && (
                  <div>
                    <p className="font-medium mb-1">Additional Notes</p>
                    <p className="text-neutral-600">{medicalHistory.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation History
          </CardTitle>
          <CardDescription>
            {consultations.length} consultation(s) on record
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consultations.length === 0 ? (
            <p className="text-sm text-neutral-600">No consultations yet</p>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {format(new Date(consultation.created_at), 'MMMM dd, yyyy')}
                        </CardTitle>
                        {consultation.appointment && (
                          <CardDescription>
                            Appointment at {format(new Date(`2000-01-01T${consultation.appointment.start_time}`), 'h:mm a')}
                          </CardDescription>
                        )}
                      </div>
                      {consultation.prescriptions.length > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Pill className="h-3 w-3 mr-1" />
                          {consultation.prescriptions.length} Prescription(s)
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="diagnosis" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="treatment">Treatment</TabsTrigger>
                      </TabsList>

                      <TabsContent value="diagnosis" className="space-y-2">
                        {consultation.diagnosis ? (
                          <p className="text-sm text-neutral-600">{consultation.diagnosis}</p>
                        ) : (
                          <p className="text-sm text-neutral-500">No diagnosis recorded</p>
                        )}
                      </TabsContent>

                      <TabsContent value="notes" className="space-y-3">
                        {consultation.symptoms && (
                          <div>
                            <p className="text-sm font-medium mb-1">Symptoms</p>
                            <p className="text-sm text-neutral-600">{consultation.symptoms}</p>
                          </div>
                        )}
                        {consultation.examination_notes && (
                          <div>
                            <p className="text-sm font-medium mb-1">Examination</p>
                            <p className="text-sm text-neutral-600">{consultation.examination_notes}</p>
                          </div>
                        )}
                        {!consultation.symptoms && !consultation.examination_notes && (
                          <p className="text-sm text-neutral-500">No notes recorded</p>
                        )}
                      </TabsContent>

                      <TabsContent value="treatment" className="space-y-3">
                        {consultation.treatment_plan && (
                          <div>
                            <p className="text-sm font-medium mb-1">Treatment Plan</p>
                            <p className="text-sm text-neutral-600">{consultation.treatment_plan}</p>
                          </div>
                        )}
                        {consultation.follow_up_date && (
                          <div>
                            <p className="text-sm font-medium mb-1">Follow-up Date</p>
                            <p className="text-sm text-neutral-600">
                              {format(new Date(consultation.follow_up_date), 'MMMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                        {consultation.prescriptions.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Prescriptions</p>
                            {consultation.prescriptions.map((prescription: any) => (
                              <div key={prescription.id} className="border rounded p-3 mb-2 space-y-2">
                                <div className="space-y-1">
                                  {prescription.medications.map((med: any, idx: number) => (
                                    <div key={idx} className="text-xs">
                                      <p className="font-medium">{med.name}</p>
                                      <p className="text-neutral-600">
                                        {med.dosage} • {med.frequency}
                                        {med.duration && ` • ${med.duration}`}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                {prescription.instructions && (
                                  <div className="text-xs pt-2 border-t">
                                    <p className="font-medium">Instructions:</p>
                                    <p className="text-neutral-600">{prescription.instructions}</p>
                                  </div>
                                )}
                                {prescription.valid_until && (
                                  <div className="text-xs text-neutral-500">
                                    Valid until: {format(new Date(prescription.valid_until), 'MMM dd, yyyy')}
                                  </div>
                                )}
                                <div className="pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`/api/prescriptions/${prescription.id}/pdf`, '_blank')}
                                    className="w-full text-xs"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download PDF
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!consultation.treatment_plan && !consultation.follow_up_date && (
                          <p className="text-sm text-neutral-500">No treatment plan recorded</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Medical Documents
          </CardTitle>
          <CardDescription>
            {documents.length} document(s) on file
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-neutral-600">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{document.file_name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {getDocumentTypeLabel(document.document_type)}
                      </Badge>
                    </div>
                    {document.description && (
                      <p className="text-xs text-neutral-600 mb-1">{document.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span>{formatFileSize(document.file_size)}</span>
                      <span>•</span>
                      <span>Uploaded {format(new Date(document.uploaded_at), 'MMM dd, yyyy')}</span>
                      <span>•</span>
                      <span>by {document.uploaded_by.full_name}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDocument(document.id, document.file_name)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
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
            <DialogDescription>
              Record patient's medical history for {patient.first_name} {patient.last_name}
            </DialogDescription>
          </DialogHeader>
          <MedicalHistoryForm
            patientId={patient.id}
            existingHistory={medicalHistory}
            onSuccess={() => {
              setIsMedicalHistoryDialogOpen(false)
              loadPatientData()
            }}
            onCancel={() => setIsMedicalHistoryDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
