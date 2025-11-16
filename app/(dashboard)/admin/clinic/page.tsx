'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useClinic } from '@/hooks/use-clinic'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const clinicSchema = z.object({
  name: z.string().min(2, 'Clinic name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
})

type ClinicFormValues = z.infer<typeof clinicSchema>

export default function ClinicManagementPage() {
  const router = useRouter()
  const { clinic, loading: clinicLoading, refreshClinic } = useClinic()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
  })

  useEffect(() => {
    if (clinic) {
      form.reset({
        name: clinic.name,
        address: clinic.address || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
      })
    }
  }, [clinic, form])

  const onSubmit = async (values: ClinicFormValues) => {
    if (!clinic) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/clinic/${clinic.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          address: values.address,
          phone: values.phone,
          email: values.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update clinic')
      }

      setSuccess('Clinic information updated successfully')
      refreshClinic()
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the clinic')
    } finally {
      setIsLoading(false)
    }
  }

  if (clinicLoading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="flex items-center justify-center py-12">
          <div className="text-neutral-600">Loading...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!clinic) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="flex items-center justify-center py-12">
          <div className="text-neutral-600">No clinic found</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clinic Management</h2>
            <p className="text-neutral-600">Update your clinic information</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
            <CardDescription>
              Update your clinic's contact information and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinic Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>
                        The official name of your clinic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>
                        Contact email for your clinic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>
                        Contact phone number for your clinic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>
                        Full address of your clinic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    {success}
                  </div>
                )}

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
