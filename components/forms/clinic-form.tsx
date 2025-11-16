'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
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

const clinicSchema = z.object({
  name: z.string().min(2, 'Clinic name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
})

type ClinicFormValues = z.infer<typeof clinicSchema>

interface ClinicFormProps {
  onSuccess?: () => void
}

export function ClinicForm({ onSuccess }: ClinicFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
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

  const onSubmit = async (values: ClinicFormValues) => {
    if (!user) {
      setError('You must be logged in to create a clinic')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create clinic via API
      const response = await fetch('/api/clinic', {
        method: 'POST',
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
        throw new Error(data.error || 'Failed to create clinic')
      }

      // Success
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the clinic')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clinic Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Smith Medical Clinic" {...field} disabled={isLoading} />
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
                <Input
                  type="email"
                  placeholder="contact@clinic.com"
                  {...field}
                  disabled={isLoading}
                />
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
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  {...field}
                  disabled={isLoading}
                />
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
                <Textarea
                  placeholder="123 Main St, City, State, ZIP"
                  {...field}
                  disabled={isLoading}
                />
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating clinic...' : 'Create Clinic'}
        </Button>
      </form>
    </Form>
  )
}
