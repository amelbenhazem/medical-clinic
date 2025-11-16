'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil, Trash2, Link as LinkIcon, Unlink } from 'lucide-react'
import type { Tables } from '@/types/database.types'

type Patient = Tables<'patients'>

interface PatientsTableProps {
  patients: Patient[]
  onView?: (patient: Patient) => void
  onEdit?: (patient: Patient) => void
  onDelete?: (patient: Patient) => void
  onLink?: (patient: Patient) => void
  onUnlink?: (patient: Patient) => void
  isLoading?: boolean
}

export function PatientsTable({
  patients,
  onView,
  onEdit,
  onDelete,
  onLink,
  onUnlink,
  isLoading,
}: PatientsTableProps) {
  const router = useRouter()

  const handleView = (patient: Patient) => {
    if (onView) {
      onView(patient)
    } else {
      router.push(`/receptionist/patients/${patient.id}`)
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
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading patients...</div>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">No patients found</p>
        <p className="text-sm text-neutral-500 mt-2">
          Register your first patient to get started
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Portal Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">
                {patient.first_name} {patient.last_name}
              </TableCell>
              <TableCell>{calculateAge(patient.date_of_birth)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {patient.gender}
                </Badge>
              </TableCell>
              <TableCell>{patient.phone}</TableCell>
              <TableCell>
                {patient.email || (
                  <span className="text-neutral-400 text-sm">Not provided</span>
                )}
              </TableCell>
              <TableCell>
                {patient.profile_id ? (
                  <Badge className="bg-green-100 text-green-800">
                    Linked
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-neutral-600">
                    Not Linked
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-neutral-600">
                {formatDate(patient.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(patient)}
                    title="View patient"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(patient)}
                      title="Edit patient"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {patient.profile_id ? (
                    onUnlink && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUnlink(patient)}
                        title="Unlink from portal account"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    )
                  ) : (
                    onLink && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onLink(patient)}
                        title="Link to portal account"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    )
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(patient)}
                      title="Delete patient"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
