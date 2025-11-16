'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Plus } from 'lucide-react'

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

const medicalHistorySchema = z.object({
  allergies: z.array(z.string()).optional(),
  chronic_conditions: z.array(z.string()).optional(),
  past_surgeries: z.array(z.string()).optional(),
  family_history: z.string().optional(),
  blood_type: z.string().optional(),
  notes: z.string().optional(),
})

type MedicalHistoryFormValues = z.infer<typeof medicalHistorySchema>

interface MedicalHistoryFormProps {
  patientId: string
  existingHistory?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function MedicalHistoryForm({
  patientId,
  existingHistory,
  onSuccess,
  onCancel,
}: MedicalHistoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MedicalHistoryFormValues>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      allergies: existingHistory?.allergies || [],
      chronic_conditions: existingHistory?.chronic_conditions || [],
      past_surgeries: existingHistory?.past_surgeries || [],
      family_history: existingHistory?.family_history || '',
      blood_type: existingHistory?.blood_type || '',
      notes: existingHistory?.notes || '',
    },
  })

  const [newAllergy, setNewAllergy] = useState('')
  const [newCondition, setNewCondition] = useState('')
  const [newSurgery, setNewSurgery] = useState('')

  const onSubmit = async (data: MedicalHistoryFormValues) => {
    setIsSubmitting(true)

    try {
      const url = existingHistory
        ? `/api/medical-history/${existingHistory.id}`
        : '/api/medical-history'

      const method = existingHistory ? 'PATCH' : 'POST'
      const body = existingHistory
        ? data
        : { ...data, patient_id: patientId }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save medical history')
      }

      onSuccess?.()
    } catch (error) {
      console.error('Error saving medical history:', error)
      alert(error instanceof Error ? error.message : 'Failed to save medical history')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addAllergy = () => {
    if (newAllergy.trim()) {
      const currentAllergies = form.getValues('allergies') || []
      form.setValue('allergies', [...currentAllergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  const removeAllergy = (index: number) => {
    const currentAllergies = form.getValues('allergies') || []
    form.setValue(
      'allergies',
      currentAllergies.filter((_, i) => i !== index)
    )
  }

  const addCondition = () => {
    if (newCondition.trim()) {
      const currentConditions = form.getValues('chronic_conditions') || []
      form.setValue('chronic_conditions', [...currentConditions, newCondition.trim()])
      setNewCondition('')
    }
  }

  const removeCondition = (index: number) => {
    const currentConditions = form.getValues('chronic_conditions') || []
    form.setValue(
      'chronic_conditions',
      currentConditions.filter((_, i) => i !== index)
    )
  }

  const addSurgery = () => {
    if (newSurgery.trim()) {
      const currentSurgeries = form.getValues('past_surgeries') || []
      form.setValue('past_surgeries', [...currentSurgeries, newSurgery.trim()])
      setNewSurgery('')
    }
  }

  const removeSurgery = (index: number) => {
    const currentSurgeries = form.getValues('past_surgeries') || []
    form.setValue(
      'past_surgeries',
      currentSurgeries.filter((_, i) => i !== index)
    )
  }

  const allergies = form.watch('allergies') || []
  const conditions = form.watch('chronic_conditions') || []
  const surgeries = form.watch('past_surgeries') || []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Blood Type */}
        <FormField
          control={form.control}
          name="blood_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Allergies */}
        <div className="space-y-2">
          <FormLabel>Allergies</FormLabel>
          <FormDescription>
            Important: List all known allergies for patient safety
          </FormDescription>
          <div className="flex gap-2">
            <Input
              placeholder="Add allergy..."
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addAllergy()
                }
              }}
            />
            <Button type="button" onClick={addAllergy} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {allergies.length > 0 && (
            <div className="space-y-1">
              {allergies.map((allergy, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-red-50 p-2 rounded text-sm"
                >
                  <span className="text-red-800">{allergy}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAllergy(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="space-y-2">
          <FormLabel>Chronic Conditions</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add chronic condition..."
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCondition()
                }
              }}
            />
            <Button type="button" onClick={addCondition} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {conditions.length > 0 && (
            <div className="space-y-1">
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-neutral-50 p-2 rounded text-sm"
                >
                  <span>{condition}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Surgeries */}
        <div className="space-y-2">
          <FormLabel>Past Surgeries</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add past surgery..."
              value={newSurgery}
              onChange={(e) => setNewSurgery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSurgery()
                }
              }}
            />
            <Button type="button" onClick={addSurgery} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {surgeries.length > 0 && (
            <div className="space-y-1">
              {surgeries.map((surgery, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-neutral-50 p-2 rounded text-sm"
                >
                  <span>{surgery}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSurgery(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Family History */}
        <FormField
          control={form.control}
          name="family_history"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family History</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Relevant family medical history..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any relevant hereditary conditions or family health issues
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any other relevant medical information..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
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
            {isSubmitting ? 'Saving...' : 'Save Medical History'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
