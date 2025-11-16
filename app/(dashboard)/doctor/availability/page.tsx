'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/auth/auth-context'
import { Clock, Save } from 'lucide-react'

type DayAvailability = {
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const DEFAULT_AVAILABILITY: DayAvailability[] = DAYS.map((day) => ({
  day_of_week: day.value,
  start_time: '09:00',
  end_time: '17:00',
  is_available: day.value >= 1 && day.value <= 5, // Default: Monday-Friday
}))

export default function DoctorAvailabilityPage() {
  const { user } = useAuth()
  const [availability, setAvailability] = useState<DayAvailability[]>(DEFAULT_AVAILABILITY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadAvailability()
    }
  }, [user?.id])

  const loadAvailability = async () => {
    try {
      const response = await fetch(`/api/availability?doctor_id=${user?.id}`)
      const data = await response.json()

      if (response.ok && data.availability.length > 0) {
        // Merge with default availability to ensure all days are present
        const mergedAvailability = DAYS.map((day) => {
          const existingDay = data.availability.find(
            (a: DayAvailability) => a.day_of_week === day.value
          )
          return existingDay || {
            day_of_week: day.value,
            start_time: '09:00',
            end_time: '17:00',
            is_available: false,
          }
        })
        setAvailability(mergedAvailability)
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (dayOfWeek: number) => {
    setAvailability((prev) =>
      prev.map((day) =>
        day.day_of_week === dayOfWeek
          ? { ...day, is_available: !day.is_available }
          : day
      )
    )
  }

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailability((prev) =>
      prev.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, [field]: value } : day
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: user?.id,
          availability: availability.filter((day) => day.is_available),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Availability saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save availability' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading availability...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Availability Settings</h2>
        <p className="text-neutral-600">Set your weekly availability for appointments</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Availability Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            Configure your working hours for each day of the week. Appointments can only be booked during your available hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const dayAvailability = availability.find((a) => a.day_of_week === day.value)
            if (!dayAvailability) return null

            return (
              <div
                key={day.value}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3 w-32">
                  <Switch
                    checked={dayAvailability.is_available}
                    onCheckedChange={() => handleToggleDay(day.value)}
                  />
                  <Label className="font-medium">{day.label}</Label>
                </div>

                {dayAvailability.is_available ? (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-neutral-600">From:</Label>
                      <input
                        type="time"
                        value={dayAvailability.start_time}
                        onChange={(e) =>
                          handleTimeChange(day.value, 'start_time', e.target.value)
                        }
                        className="border rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-neutral-600">To:</Label>
                      <input
                        type="time"
                        value={dayAvailability.end_time}
                        onChange={(e) =>
                          handleTimeChange(day.value, 'end_time', e.target.value)
                        }
                        className="border rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500 flex-1">Not available</div>
                )}
              </div>
            )
          })}

          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Availability'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
