'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card } from '@/components/ui/card'
import { PatientForm } from '@/components/forms/patient-form'
import { PatientsTable } from '@/components/tables/patients-table'
import { useClinic } from '@/hooks/use-clinic'
import { Plus, Search } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Tables } from '@/types/database.types'

type Patient = Tables<'patients'>
type AvailableUser = {
  id: string
  email: string
  created_at: string
}

export default function ReceptionistPatientsPage() {
  const { clinic, loading: clinicLoading } = useClinic()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [linkLoading, setLinkLoading] = useState(false)

  useEffect(() => {
    if (clinic?.id) {
      loadPatients()
    }
  }, [clinic?.id])

  useEffect(() => {
    // Filter patients based on search query
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = patients.filter(
        (patient) =>
          patient.first_name.toLowerCase().includes(query) ||
          patient.last_name.toLowerCase().includes(query) ||
          patient.phone.includes(query) ||
          patient.email?.toLowerCase().includes(query)
      )
      setFilteredPatients(filtered)
    }
  }, [searchQuery, patients])

  const loadPatients = async () => {
    if (!clinic?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/patients?clinic_id=${clinic.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load patients')
      }

      setPatients(data.patients || [])
      setFilteredPatients(data.patients || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSuccess = () => {
    setIsRegisterDialogOpen(false)
    loadPatients()
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    setSelectedPatient(null)
    loadPatients()
  }

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPatient) return

    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete patient')
      }

      setIsDeleteDialogOpen(false)
      setSelectedPatient(null)
      loadPatients()
    } catch (err: any) {
      setError(err.message || 'Failed to delete patient')
    }
  }

  const handleLinkClick = async (patient: Patient) => {
    setSelectedPatient(patient)
    setSelectedUserId('')
    setIsLinkDialogOpen(true)

    // Load available users
    try {
      const response = await fetch('/api/users/available')
      const data = await response.json()

      if (response.ok) {
        setAvailableUsers(data.users || [])
      }
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  const handleLinkConfirm = async () => {
    if (!selectedPatient || !selectedUserId) return

    setLinkLoading(true)

    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUserId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link patient')
      }

      setIsLinkDialogOpen(false)
      setSelectedPatient(null)
      setSelectedUserId('')
      loadPatients()
    } catch (err: any) {
      setError(err.message || 'Failed to link patient')
    } finally {
      setLinkLoading(false)
    }
  }

  const handleUnlinkClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsUnlinkDialogOpen(true)
  }

  const handleUnlinkConfirm = async () => {
    if (!selectedPatient) return

    setLinkLoading(true)

    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}/link`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink patient')
      }

      setIsUnlinkDialogOpen(false)
      setSelectedPatient(null)
      loadPatients()
    } catch (err: any) {
      setError(err.message || 'Failed to unlink patient')
    } finally {
      setLinkLoading(false)
    }
  }

  if (clinicLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  if (!clinic) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">No clinic found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
          <p className="text-neutral-600">Manage patient records</p>
        </div>
        <Button onClick={() => setIsRegisterDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Register Patient
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <PatientsTable
          patients={filteredPatients}
          isLoading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onLink={handleLinkClick}
          onUnlink={handleUnlinkClick}
        />
      </Card>

      {/* Register Patient Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
            <DialogDescription>
              Fill in the patient information below
            </DialogDescription>
          </DialogHeader>
          <PatientForm
            clinicId={clinic.id}
            onSuccess={handleRegisterSuccess}
            onCancel={() => setIsRegisterDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update patient information
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <PatientForm
              clinicId={clinic.id}
              initialData={selectedPatient}
              mode="edit"
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedPatient(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the patient record for{' '}
              <span className="font-semibold">
                {selectedPatient?.first_name} {selectedPatient?.last_name}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPatient(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link Patient to User Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link Patient to Portal Account</DialogTitle>
            <DialogDescription>
              Link {selectedPatient?.first_name} {selectedPatient?.last_name} to a user account so they can access the patient portal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User Account</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select a user account" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-neutral-600">
                      No available users. All users are either staff or already linked to patients.
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">
                Only showing users who are not staff and not already linked to other patients
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsLinkDialogOpen(false)
                setSelectedPatient(null)
                setSelectedUserId('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkConfirm}
              disabled={!selectedUserId || linkLoading}
            >
              {linkLoading ? 'Linking...' : 'Link Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unlink Patient Confirmation Dialog */}
      <AlertDialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Patient from Portal Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect{' '}
              <span className="font-semibold">
                {selectedPatient?.first_name} {selectedPatient?.last_name}
              </span>
              {' '}from their portal account. They will no longer be able to access their records through the patient portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPatient(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkConfirm}
              disabled={linkLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {linkLoading ? 'Unlinking...' : 'Unlink Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
