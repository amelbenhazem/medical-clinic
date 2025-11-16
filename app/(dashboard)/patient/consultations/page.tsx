'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, Pill, AlertTriangle, User, Calendar, Download } from 'lucide-react'
import { format } from 'date-fns'

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
  doctor: {
    full_name: string
  }
  prescriptions: Array<{
    id: string
    medications: Array<{
      name: string
      dosage: string
      frequency: string
      duration: string
    }>
    instructions: string | null
    valid_until: string | null
  }>
}

export default function PatientConsultationsPage() {
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [patientId, setPatientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get patient data
      const patientRes = await fetch('/api/patients/me')
      const patientResult = await patientRes.json()

      if (!patientRes.ok) {
        console.error('Error loading patient data:', patientResult.error)
        return
      }

      const pId = patientResult.patient.id
      setPatientId(pId)

      // Get medical history
      const historyRes = await fetch(`/api/medical-history?patient_id=${pId}`)
      const historyResult = await historyRes.json()

      if (historyRes.ok) {
        setMedicalHistory(historyResult.medical_history)
      }

      // Get consultations
      const consultationsRes = await fetch(`/api/consultations?patient_id=${pId}`)
      const consultationsResult = await consultationsRes.json()

      if (consultationsRes.ok) {
        setConsultations(consultationsResult.consultations || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading medical records...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/patient">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">My Medical Records</h2>
        <p className="text-neutral-600">View your consultation history and medical information</p>
      </div>

      {/* Medical History Alert - Allergies */}
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
        {/* Medical History Summary */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            {!medicalHistory ? (
              <p className="text-sm text-neutral-600">No medical history recorded yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
                    <ul className="list-disc list-inside text-neutral-600 space-y-1 text-xs">
                      {medicalHistory.past_surgeries.map((surgery, index) => (
                        <li key={index}>{surgery}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {medicalHistory.family_history && (
                  <div>
                    <p className="font-medium mb-1">Family History</p>
                    <p className="text-neutral-600 text-xs">{medicalHistory.family_history}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultations History */}
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
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No consultations yet</p>
            </div>
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
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          Dr. {consultation.doctor.full_name}
                        </CardDescription>
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
                            <div className="flex items-center gap-1 text-sm text-neutral-600">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(consultation.follow_up_date), 'MMMM dd, yyyy')}
                            </div>
                          </div>
                        )}
                        {consultation.prescriptions.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Prescriptions</p>
                            {consultation.prescriptions.map((prescription) => (
                              <div key={prescription.id} className="border rounded p-3 mb-2 space-y-2">
                                {prescription.medications.map((med, idx) => (
                                  <div key={idx} className="text-xs">
                                    <p className="font-medium">{med.name}</p>
                                    <p className="text-neutral-600">
                                      {med.dosage} • {med.frequency}
                                      {med.duration && ` • ${med.duration}`}
                                    </p>
                                  </div>
                                ))}
                                {prescription.instructions && (
                                  <div className="text-xs pt-2 border-t">
                                    <p className="font-medium mb-1">Instructions</p>
                                    <p className="text-neutral-600">{prescription.instructions}</p>
                                  </div>
                                )}
                                {prescription.valid_until && (
                                  <div className="text-xs text-neutral-500">
                                    Valid until: {format(new Date(prescription.valid_until), 'MMMM dd, yyyy')}
                                  </div>
                                )}
                                <div className="pt-2 border-t mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`/api/prescriptions/${prescription.id}/pdf`, '_blank')}
                                    className="w-full"
                                  >
                                    <Download className="h-3 w-3 mr-2" />
                                    Download PDF
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!consultation.treatment_plan && !consultation.follow_up_date && consultation.prescriptions.length === 0 && (
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
    </div>
  )
}
