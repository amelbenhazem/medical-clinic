'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database.types'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const patientSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select a gender',
  }),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientSchema>

interface PatientFormProps {
  clinicId: string
  onSuccess?: (patientId: string) => void
  onCancel?: () => void
  initialData?: Tables<'patients'>
  mode?: 'create' | 'edit'
}

export function PatientForm({
  clinicId,
  onSuccess,
  onCancel,
  initialData,
  mode = 'create'
}: PatientFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
      date_of_birth: initialData?.date_of_birth || '',
      gender: initialData?.gender || undefined,
      phone: initialData?.phone || '',
      email: initialData?.email || null || '',
      address: initialData?.address || null || '',
      emergency_contact_name: initialData?.emergency_contact_name || null || '',
      emergency_contact_phone: initialData?.emergency_contact_phone || null || '',
    },
  })

  const onSubmit = async (values: PatientFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'edit' && initialData?.id) {
        // Update existing patient via API
        const response = await fetch(`/api/patients/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: values.first_name,
            last_name: values.last_name,
            date_of_birth: values.date_of_birth,
            gender: values.gender,
            phone: values.phone,
            email: values.email || null,
            address: values.address || null,
            emergency_contact_name: values.emergency_contact_name || null,
            emergency_contact_phone: values.emergency_contact_phone || null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update patient')
        }

        if (onSuccess) {
          onSuccess(initialData.id)
        }
      } else {
        // Create new patient via API
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clinic_id: clinicId,
            first_name: values.first_name,
            last_name: values.last_name,
            date_of_birth: values.date_of_birth,
            gender: values.gender,
            phone: values.phone,
            email: values.email || null,
            address: values.address || null,
            emergency_contact_name: values.emergency_contact_name || null,
            emergency_contact_phone: values.emergency_contact_phone || null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create patient')
        }

        if (onSuccess) {
          onSuccess(data.patient.id)
        }
      }

      form.reset()
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the patient')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    disabled={isLoading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="123 Main St, City, State, ZIP"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jane Doe"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergency_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Phone (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading
              ? (mode === 'edit' ? 'Updating...' : 'Registering...')
              : (mode === 'edit' ? 'Update Patient' : 'Register Patient')
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}
