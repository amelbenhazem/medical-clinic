'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const consultationSchema = z.object({
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  examination_notes: z.string().optional(),
  treatment_plan: z.string().optional(),
  follow_up_date: z.date().optional(),
})

type ConsultationFormValues = z.infer<typeof consultationSchema>

interface ConsultationFormProps {
  appointmentId?: string
  patientId: string
  doctorId: string
  onSuccess?: () => void
  onCancel?: () => void
  defaultValues?: Partial<ConsultationFormValues>
}

export function ConsultationForm({
  appointmentId,
  patientId,
  doctorId,
  onSuccess,
  onCancel,
  defaultValues,
}: ConsultationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: defaultValues || {
      symptoms: '',
      diagnosis: '',
      examination_notes: '',
      treatment_plan: '',
    },
  })

  const onSubmit = async (data: ConsultationFormValues) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          patient_id: patientId,
          doctor_id: doctorId,
          symptoms: data.symptoms,
          diagnosis: data.diagnosis,
          examination_notes: data.examination_notes,
          treatment_plan: data.treatment_plan,
          follow_up_date: data.follow_up_date
            ? format(data.follow_up_date, 'yyyy-MM-dd')
            : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create consultation')
      }

      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating consultation:', error)
      alert(error instanceof Error ? error.message : 'Failed to create consultation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="symptoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symptoms</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter patient symptoms..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Describe the symptoms reported by the patient
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="examination_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Examination Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter examination findings..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Record physical examination findings and observations
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diagnosis</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter diagnosis..."
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Medical diagnosis based on symptoms and examination
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="treatment_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treatment Plan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter treatment plan..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Recommended treatment, medications, and care instructions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="follow_up_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Follow-up Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Schedule a follow-up appointment if needed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Consultation'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
