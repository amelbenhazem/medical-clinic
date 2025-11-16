'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrescriptionForm } from '@/components/forms/prescription-form'
import { useAuth } from '@/lib/auth/auth-context'
import { FileText, Calendar, User, Pill, Download } from 'lucide-react'
import { format } from 'date-fns'

type Consultation = {
  id: string
  diagnosis: string | null
  symptoms: string | null
  examination_notes: string | null
  treatment_plan: string | null
  follow_up_date: string | null
  created_at: string
  patient: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
  }
  doctor: {
    id: string
    full_name: string
  }
  appointment: {
    id: string
    appointment_date: string
    start_time: string
    status: string
  } | null
  prescriptions: any[]
}

export default function DoctorConsultationsPage() {
  const { profile } = useAuth()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [prescriptionDialog, setPrescriptionDialog] = useState<{
    open: boolean
    consultation: Consultation | null
  }>({ open: false, consultation: null })

  useEffect(() => {
    if (profile?.id) {
      loadConsultations()
    }
  }, [profile?.id])

  const loadConsultations = async () => {
    if (!profile?.id) return

    setLoading(true)

    try {
      const response = await fetch(`/api/consultations?doctor_id=${profile.id}`)
      const data = await response.json()

      if (response.ok) {
        setConsultations(data.consultations || [])
      }
    } catch (error) {
      console.error('Error loading consultations:', error)
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Consultations</h2>
        <p className="text-neutral-600">View and manage patient consultation records</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-600">Loading consultations...</div>
      ) : consultations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-600">
            No consultations found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {consultation.patient.first_name} {consultation.patient.last_name}
                    </CardTitle>
                    <CardDescription>
                      Age: {calculateAge(consultation.patient.date_of_birth)} •{' '}
                      {consultation.appointment
                        ? format(
                            new Date(consultation.appointment.appointment_date),
                            'MMMM dd, yyyy'
                          )
                        : format(new Date(consultation.created_at), 'MMMM dd, yyyy')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {consultation.prescriptions.length > 0 ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Pill className="h-3 w-3 mr-1" />
                        {consultation.prescriptions.length} Prescription(s)
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPrescriptionDialog({ open: true, consultation })
                        }
                      >
                        <Pill className="h-4 w-4 mr-1" />
                        Add Prescription
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="notes" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                    <TabsTrigger value="treatment">Treatment</TabsTrigger>
                    {consultation.prescriptions.length > 0 && (
                      <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="notes" className="space-y-3">
                    {consultation.symptoms && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Symptoms</h4>
                        <p className="text-sm text-neutral-600">
                          {consultation.symptoms}
                        </p>
                      </div>
                    )}
                    {consultation.examination_notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Examination Notes</h4>
                        <p className="text-sm text-neutral-600">
                          {consultation.examination_notes}
                        </p>
                      </div>
                    )}
                    {!consultation.symptoms && !consultation.examination_notes && (
                      <p className="text-sm text-neutral-500">No notes recorded</p>
                    )}
                  </TabsContent>

                  <TabsContent value="diagnosis">
                    {consultation.diagnosis ? (
                      <p className="text-sm text-neutral-600">{consultation.diagnosis}</p>
                    ) : (
                      <p className="text-sm text-neutral-500">No diagnosis recorded</p>
                    )}
                  </TabsContent>

                  <TabsContent value="treatment" className="space-y-3">
                    {consultation.treatment_plan && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Treatment Plan</h4>
                        <p className="text-sm text-neutral-600">
                          {consultation.treatment_plan}
                        </p>
                      </div>
                    )}
                    {consultation.follow_up_date && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Follow-up Date</h4>
                        <p className="text-sm text-neutral-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(consultation.follow_up_date), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    {!consultation.treatment_plan && !consultation.follow_up_date && (
                      <p className="text-sm text-neutral-500">No treatment plan recorded</p>
                    )}
                  </TabsContent>

                  {consultation.prescriptions.length > 0 && (
                    <TabsContent value="prescriptions" className="space-y-3">
                      {consultation.prescriptions.map((prescription: any) => (
                        <div key={prescription.id} className="border rounded p-3 space-y-2">
                          <div className="space-y-2">
                            {prescription.medications.map((med: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <p className="font-medium">{med.name}</p>
                                <p className="text-neutral-600">
                                  {med.dosage} • {med.frequency}
                                  {med.duration && ` • ${med.duration}`}
                                </p>
                              </div>
                            ))}
                          </div>
                          {prescription.instructions && (
                            <div className="pt-2 border-t text-sm">
                              <p className="font-medium">Instructions:</p>
                              <p className="text-neutral-600">{prescription.instructions}</p>
                            </div>
                          )}
                          {prescription.valid_until && (
                            <div className="text-xs text-neutral-500">
                              Valid until:{' '}
                              {format(new Date(prescription.valid_until), 'MMM dd, yyyy')}
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
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Prescription Dialog */}
      <Dialog
        open={prescriptionDialog.open}
        onOpenChange={(open) =>
          setPrescriptionDialog({ open, consultation: null })
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Prescription</DialogTitle>
            <DialogDescription>
              Create prescription for{' '}
              {prescriptionDialog.consultation &&
                `${prescriptionDialog.consultation.patient.first_name} ${prescriptionDialog.consultation.patient.last_name}`}
            </DialogDescription>
          </DialogHeader>
          {prescriptionDialog.consultation && profile && (
            <PrescriptionForm
              consultationId={prescriptionDialog.consultation.id}
              patientId={prescriptionDialog.consultation.patient.id}
              doctorId={profile.id}
              onSuccess={() => {
                setPrescriptionDialog({ open: false, consultation: null })
                loadConsultations()
              }}
              onCancel={() =>
                setPrescriptionDialog({ open: false, consultation: null })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
