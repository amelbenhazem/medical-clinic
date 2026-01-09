'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppointmentPriorityBadge } from './appointment-priority-badge'
import { Sparkles, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'

interface SlotSuggestion {
  time: string
  score: number
  reason: string
  priority: 'low' | 'medium' | 'high'
}

interface SmartSlotSuggestionsProps {
  patientId: string
  doctorId: string
  serviceId: string
  date: string
  notes: string
  availableSlots: string[]
  onSlotSelect: (time: string) => void
  className?: string
}

export function SmartSlotSuggestions({
  patientId,
  doctorId,
  serviceId,
  date,
  notes,
  availableSlots,
  onSlotSelect,
  className = ''
}: SmartSlotSuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<{
    urgency: UrgencyLevel
    urgency_reason: string
    suggested_slots: SlotSuggestion[]
    predicted_duration: number
    duration_reason: string
    recommendedAction: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSuggestions = async () => {
    if (!patientId || !doctorId || !serviceId || !date || availableSlots.length === 0) {
      setError('Informations incomplètes pour générer des suggestions')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/optimize-appointments/suggest-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: doctorId,
          service_id: serviceId,
          date,
          notes,
          available_slots: availableSlots
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération des suggestions')
      }

      setSuggestions(data)
    } catch (err: any) {
      console.error('Error fetching suggestions:', err)
      setError(err.message || 'Erreur lors de la génération des suggestions IA')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-neutral-100 text-neutral-800'
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Suggestions IA Intelligentes
              </CardTitle>
              <CardDescription>
                Obtenez des suggestions optimisées basées sur l'urgence et l'historique
              </CardDescription>
            </div>
            <Button
              onClick={fetchSuggestions}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Obtenir Suggestions
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {suggestions && (
            <>
              {/* Affichage de l'urgence */}
              <div className="space-y-2">
                <AppointmentPriorityBadge
                  urgency={suggestions.urgency}
                  reason={suggestions.urgency_reason}
                />
                {suggestions.recommendedAction && (
                  <p className="text-sm text-neutral-600">
                    💡 {suggestions.recommendedAction}
                  </p>
                )}
              </div>

              {/* Suggestions de créneaux */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Créneaux Recommandés :</h4>
                {suggestions.suggested_slots.map((slot, index) => (
                  <div
                    key={slot.time}
                    className="border rounded-lg p-4 space-y-2 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-neutral-500" />
                          <span className="font-semibold">{formatTime(slot.time)}</span>
                          {index === 0 && suggestions.urgency !== 'low' && (
                            <Badge className="bg-blue-100 text-blue-800">
                              ⭐ Recommandé
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">{slot.reason}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={getScoreColor(slot.score)}
                          >
                            Score: {slot.score}/10
                          </Badge>
                          <Badge variant="outline">
                            Priorité: {slot.priority}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => onSlotSelect(slot.time)}
                        size="sm"
                        variant={index === 0 ? 'default' : 'outline'}
                        className="ml-4"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Utiliser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Prédiction de durée */}
              <div className="pt-3 border-t">
                <p className="text-sm text-neutral-600">
                  <strong>Durée prédite :</strong> {suggestions.predicted_duration} minutes
                  <br />
                  <span className="text-xs italic">{suggestions.duration_reason}</span>
                </p>
              </div>
            </>
          )}

          {!suggestions && !loading && (
            <div className="text-center py-8 text-neutral-500">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Cliquez sur "Obtenir Suggestions" pour recevoir des recommandations intelligentes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
