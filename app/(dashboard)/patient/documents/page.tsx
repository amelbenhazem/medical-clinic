'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Download, ArrowLeft, FileText } from 'lucide-react'
import { format } from 'date-fns'

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

export default function PatientDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      // First get patient ID
      const patientResponse = await fetch('/api/patients/me')
      const patientResult = await patientResponse.json()

      if (patientResponse.ok) {
        // Then fetch documents
        const documentsResponse = await fetch(`/api/documents?patient_id=${patientResult.patient.id}`)
        const documentsData = await documentsResponse.json()

        if (documentsResponse.ok) {
          setDocuments(documentsData.documents || [])
        } else {
          console.error('Error fetching documents:', documentsData.error)
        }
      } else {
        console.error('Error fetching patient data:', patientResult.error)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
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

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lab_result: 'bg-blue-100 text-blue-800',
      scan: 'bg-purple-100 text-purple-800',
      prescription: 'bg-green-100 text-green-800',
      report: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || colors.other
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading documents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/patient">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">My Documents</h2>
          <p className="text-neutral-600">View and download your medical documents</p>
        </div>
      </div>

      {/* Documents List */}
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
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 mb-2">No documents uploaded yet</p>
              <p className="text-sm text-neutral-500">
                Your medical documents will appear here once uploaded by your healthcare provider
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-neutral-500" />
                      <p className="font-medium">{document.file_name}</p>
                      <Badge className={getDocumentTypeColor(document.document_type)}>
                        {getDocumentTypeLabel(document.document_type)}
                      </Badge>
                    </div>
                    {document.description && (
                      <p className="text-sm text-neutral-600 mb-2">{document.description}</p>
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
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
