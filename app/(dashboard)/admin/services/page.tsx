'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useClinic } from '@/hooks/use-clinic'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tables } from '@/types/database.types'

type Service = Tables<'services'>

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

export default function ServicesManagementPage() {
  const router = useRouter()
  const { clinic, loading: clinicLoading } = useClinic()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      duration_minutes: 30,
    },
  })

  const fetchServices = async () => {
    if (!clinic) return

    try {
      const response = await fetch(`/api/services?clinic_id=${clinic.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch services')
      }

      setServices(data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clinic) {
      fetchServices()
    }
  }, [clinic])

  useEffect(() => {
    if (editingService) {
      form.reset({
        name: editingService.name,
        description: editingService.description || '',
        duration_minutes: editingService.duration_minutes,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        duration_minutes: 30,
      })
    }
  }, [editingService, form])

  const onSubmit = async (values: ServiceFormValues) => {
    if (!clinic) return

    setFormError(null)

    try {
      if (editingService) {
        // Update existing service via API
        const response = await fetch(`/api/services/${editingService.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: values.name,
            description: values.description || null,
            duration_minutes: values.duration_minutes,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update service')
        }
      } else {
        // Create new service via API
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clinic_id: clinic.id,
            name: values.name,
            description: values.description || null,
            duration_minutes: values.duration_minutes,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create service')
        }
      }

      // Close dialog and refresh
      setIsCreateOpen(false)
      setEditingService(null)
      form.reset()
      fetchServices()
    } catch (err: any) {
      setFormError(err.message || 'An error occurred')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setIsCreateOpen(true)
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete service')
      }

      fetchServices()
    } catch (error: any) {
      alert(error.message || 'Failed to delete service')
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) {
      setEditingService(null)
      form.reset()
      setFormError(null)
    }
  }

  if (clinicLoading || !clinic) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="flex items-center justify-center py-12">
          <div className="text-neutral-600">Loading...</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Services Management</h2>
            <p className="text-neutral-600">Manage your clinic services</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>Add Service</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingService
                      ? 'Update the service information'
                      : 'Create a new service for your clinic'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Name</FormLabel>
                          <FormControl>
                            <Input placeholder="General Consultation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of the service..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Optional service description</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" min="5" step="5" {...field} />
                          </FormControl>
                          <FormDescription>
                            Typical duration for this service
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {formError && (
                      <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                        {formError}
                      </div>
                    )}

                    <DialogFooter>
                      <Button type="submit">
                        {editingService ? 'Update Service' : 'Create Service'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              View and manage all services offered by your clinic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-neutral-600">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                No services yet. Add your first service!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.description || 'N/A'}</TableCell>
                      <TableCell>{service.duration_minutes} min</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
