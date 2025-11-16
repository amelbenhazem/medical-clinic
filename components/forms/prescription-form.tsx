'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react'

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

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().optional(),
})

const prescriptionSchema = z.object({
  medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
  instructions: z.string().optional(),
  valid_until: z.date().optional(),
})

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>

interface PrescriptionFormProps {
  consultationId?: string
  patientId: string
  doctorId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PrescriptionForm({
  consultationId,
  patientId,
  doctorId,
  onSuccess,
  onCancel,
}: PrescriptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
      instructions: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'medications',
  })

  const onSubmit = async (data: PrescriptionFormValues) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultation_id: consultationId,
          patient_id: patientId,
          doctor_id: doctorId,
          medications: data.medications,
          instructions: data.instructions,
          valid_until: data.valid_until
            ? format(data.valid_until, 'yyyy-MM-dd')
            : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create prescription')
      }

      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating prescription:', error)
      alert(error instanceof Error ? error.message : 'Failed to create prescription')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Medications</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ name: '', dosage: '', frequency: '', duration: '' })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Medication
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border rounded-lg p-4 space-y-3 relative"
            >
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}

              <FormField
                control={form.control}
                name={`medications.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Amoxicillin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`medications.${index}.dosage`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 500mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`medications.${index}.frequency`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 3x daily" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`medications.${index}.duration`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 7 days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional instructions for the patient..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                General instructions for taking the medications
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valid_until"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Valid Until (Optional)</FormLabel>
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
                Expiration date for this prescription
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
            {isSubmitting ? 'Saving...' : 'Save Prescription'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
