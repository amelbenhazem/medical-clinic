import { generateJSON } from '../gemini-client'

/**
 * Détecte le niveau d'urgence d'un rendez-vous
 * UTILISE GOOGLE GEMINI (GRATUIT)
 */
export async function detectUrgency(params: {
  notes: string
  symptoms?: string
  patientHistory?: string
  previousUrgencies?: string[]
}): Promise<{
  level: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  keywords: string[]
  recommendedAction?: string
}> {
  const prompt = `
Tu es un assistant IA médical expert. Analyse les informations suivantes et détecte le niveau d'urgence d'un rendez-vous médical.

NOTES DU PATIENT: "${params.notes}"
SYMPTÔMES: "${params.symptoms || 'Non spécifiés'}"
HISTORIQUE PATIENT: "${params.patientHistory || 'Aucun historique disponible'}"
URGENCES PRÉCÉDENTES: ${params.previousUrgencies?.join(', ') || 'Aucune'}

Niveaux d'urgence à utiliser:
- critical: Urgence vitale (douleur thoracique, difficulté respiratoire, perte de conscience, saignement abondant, traumatisme grave, etc.)
- high: Urgence importante (douleur intense, fièvre élevée >39°C, vomissements persistants, blessure importante, etc.)
- medium: Urgence modérée (symptômes persistants depuis plusieurs jours, douleur modérée, fièvre modérée, etc.)
- low: Non urgent (contrôle de routine, renouvellement ordonnance, consultation préventive, etc.)

Analyse en détail et retourne UNIQUEMENT un JSON avec cette structure exacte:
{
  "level": "low|medium|high|critical",
  "reason": "explication détaillée en français",
  "keywords": ["mot-clé1", "mot-clé2"],
  "recommendedAction": "action recommandée (ex: consultation immédiate, dans les 24h, etc.)"
}
`

  try {
    const result = await generateJSON(prompt)
    
    // Validation et normalisation
    const validLevels = ['low', 'medium', 'high', 'critical']
    const level = validLevels.includes(result.level) ? result.level : 'medium'
    
    return {
      level: level as 'low' | 'medium' | 'high' | 'critical',
      reason: result.reason || 'Analyse effectuée',
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
      recommendedAction: result.recommendedAction || 'Consultation normale'
    }
  } catch (error) {
    console.error('Error in detectUrgency:', error)
    // Fallback: analyse basique basée sur mots-clés
    const notesLower = (params.notes || '').toLowerCase()
    const symptomsLower = (params.symptoms || '').toLowerCase()
    const combined = `${notesLower} ${symptomsLower}`
    
    // Détection basique de mots-clés
    if (combined.match(/douleur thoracique|difficulté respiratoire|perte de conscience|saignement abondant|traumatisme grave/i)) {
      return {
        level: 'critical',
        reason: 'Mots-clés d\'urgence critique détectés',
        keywords: ['critical'],
        recommendedAction: 'Consultation immédiate requise'
      }
    }
    
    if (combined.match(/douleur intense|fièvre élevée|vomissements persistants|blessure importante/i)) {
      return {
        level: 'high',
        reason: 'Mots-clés d\'urgence importante détectés',
        keywords: ['high'],
        recommendedAction: 'Consultation dans les 24h recommandée'
      }
    }
    
    return {
      level: 'medium',
      reason: 'Analyse automatique - niveau moyen par défaut',
      keywords: [],
      recommendedAction: 'Consultation normale'
    }
  }
}

/**
 * Suggère les meilleurs créneaux pour un rendez-vous en priorisant les urgences
 * UTILISE GOOGLE GEMINI (GRATUIT)
 */
export async function suggestOptimalSlots(params: {
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  serviceId: string
  serviceName: string
  serviceDuration: number
  date: string
  notes: string
  availableSlots: string[]
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical'
  patientHistory?: {
    previousAppointments: number
    averageDuration: number
    commonIssues: string[]
  }
}): Promise<{
  urgency: 'low' | 'medium' | 'high' | 'critical'
  urgency_reason: string
  suggested_slots: Array<{
    time: string
    score: number
    reason: string
    priority: 'low' | 'medium' | 'high'
  }>
  predicted_duration: number
  duration_reason: string
  recommendedAction: string
}> {
  const urgencyInfo = params.urgencyLevel 
    ? `URGENCE DÉTECTÉE: ${params.urgencyLevel.toUpperCase()}`
    : 'Urgence à analyser'

  const prompt = `
Tu es un assistant IA pour une clinique médicale. Analyse les informations suivantes et suggère les meilleurs créneaux pour un rendez-vous, EN PRIORISANT LES URGENCES.

PATIENT:
- Nom: ${params.patientName}
- Historique consultations: ${params.patientHistory?.previousAppointments || 0}
- Durée moyenne: ${params.patientHistory?.averageDuration || params.serviceDuration} minutes

SERVICE:
- Type: ${params.serviceName}
- Durée standard: ${params.serviceDuration} minutes

MÉDECIN:
- Nom: ${params.doctorName}

DATE DEMANDÉE: ${params.date}

NOTES DU PATIENT: "${params.notes}"

${urgencyInfo}

CRÉNEAUX DISPONIBLES: ${params.availableSlots.join(', ')}

TÂCHE:
1. Si urgence CRITICAL ou HIGH: Prioriser les créneaux les plus tôt dans la journée
2. Si urgence MEDIUM: Suggérer des créneaux équilibrés
3. Si urgence LOW: Suggérer des créneaux flexibles
4. Pour chaque créneau, donner un score de 1 à 10
5. Expliquer pourquoi chaque créneau est suggéré

Retourne UNIQUEMENT un JSON avec cette structure exacte:
{
  "urgency": "low|medium|high|critical",
  "urgency_reason": "explication",
  "suggested_slots": [
    {
      "time": "HH:MM:SS",
      "score": 1-10,
      "reason": "explication en français",
      "priority": "low|medium|high"
    }
  ],
  "predicted_duration": nombre,
  "duration_reason": "explication",
  "recommendedAction": "action recommandée"
}
`

  try {
    const result = await generateJSON(prompt)
    
    // Si urgence détectée, réordonner les créneaux (plus tôt = mieux)
    if (result.urgency === 'critical' || result.urgency === 'high') {
      result.suggested_slots = result.suggested_slots.sort((a: any, b: any) => {
        // Trier par heure (plus tôt = mieux pour urgences)
        const timeA = a.time.split(':').map(Number)
        const timeB = b.time.split(':').map(Number)
        const minutesA = timeA[0] * 60 + timeA[1]
        const minutesB = timeB[0] * 60 + timeB[1]
        return minutesA - minutesB
      })
    }
    
    return {
      urgency: result.urgency || 'medium',
      urgency_reason: result.urgency_reason || 'Analyse effectuée',
      suggested_slots: result.suggested_slots || [],
      predicted_duration: result.predicted_duration || params.serviceDuration,
      duration_reason: result.duration_reason || 'Durée standard',
      recommendedAction: result.recommendedAction || 'Consultation normale'
    }
  } catch (error) {
    console.error('Error in suggestOptimalSlots:', error)
    // Fallback: retourner les créneaux disponibles sans optimisation
    return {
      urgency: params.urgencyLevel || 'medium',
      urgency_reason: 'Analyse automatique',
      suggested_slots: params.availableSlots.slice(0, 3).map(slot => ({
        time: slot,
        score: 5,
        reason: 'Créneau disponible',
        priority: 'medium' as const
      })),
      predicted_duration: params.serviceDuration,
      duration_reason: 'Durée standard',
      recommendedAction: 'Consultation normale'
    }
  }
}

/**
 * Optimise le planning d'un médecin en priorisant les urgences
 * UTILISE GOOGLE GEMINI (GRATUIT)
 */
export async function optimizeDoctorSchedule(params: {
  doctorId: string
  doctorName: string
  date: string
  appointments: Array<{
    id: string
    time: string
    duration: number
    patient: string
    notes: string
    urgency?: string
  }>
  availableSlots: string[]
}): Promise<{
  suggestions: Array<{
    type: 'move' | 'group' | 'reschedule' | 'prioritize'
    description: string
    currentAppointment?: string
    suggestedTime?: string
    reason: string
    priority: 'low' | 'medium' | 'high'
  }>
  urgencyRanking: Array<{
    appointmentId: string
    patient: string
    currentTime: string
    urgency: string
    recommendedTime?: string
  }>
  efficiency: {
    currentGaps: number
    suggestedGaps: number
    improvement: string
  }
}> {
  const appointmentsList = params.appointments.map(apt => 
    `- ${apt.time} (${apt.duration} min): ${apt.patient} - "${apt.notes}" [Urgence: ${apt.urgency || 'medium'}]`
  ).join('\n')

  const prompt = `
Tu es un assistant IA pour optimiser le planning médical. Analyse le planning d'un médecin et optimise-le EN PRIORISANT LES URGENCES.

MÉDECIN: ${params.doctorName}
DATE: ${params.date}

RENDEZ-VOUS ACTUELS:
${appointmentsList}

CRÉNEAUX DISPONIBLES: ${params.availableSlots.join(', ')}

RÈGLES D'OPTIMISATION:
1. PRIORITÉ ABSOLUE: Les urgences CRITICAL et HIGH doivent être programmées le plus tôt possible
2. Réorganiser les rendez-vous pour que les urgences soient en premier
3. Regrouper les rendez-vous non urgents pour libérer du temps
4. Réduire les temps morts entre rendez-vous
5. Maintenir des buffers pour les urgences potentielles

Retourne UNIQUEMENT un JSON avec cette structure exacte:
{
  "suggestions": [
    {
      "type": "move|group|reschedule|prioritize",
      "description": "description de l'action",
      "currentAppointment": "ID ou heure",
      "suggestedTime": "nouvelle heure",
      "reason": "pourquoi cette optimisation",
      "priority": "low|medium|high"
    }
  ],
  "urgencyRanking": [
    {
      "appointmentId": "ID",
      "patient": "nom",
      "currentTime": "heure actuelle",
      "urgency": "low|medium|high|critical",
      "recommendedTime": "heure recommandée"
    }
  ],
  "efficiency": {
    "currentGaps": nombre,
    "suggestedGaps": nombre,
    "improvement": "description"
  }
}
`

  try {
    const result = await generateJSON(prompt)
    
    // Trier les suggestions par priorité (high > medium > low)
    if (result.suggestions) {
      result.suggestions.sort((a: any, b: any) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      })
    }
    
    // Trier le ranking d'urgence (critical > high > medium > low)
    if (result.urgencyRanking) {
      result.urgencyRanking.sort((a: any, b: any) => {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0)
      })
    }
    
    return result
  } catch (error) {
    console.error('Error in optimizeDoctorSchedule:', error)
    return {
      suggestions: [],
      urgencyRanking: params.appointments.map(apt => ({
        appointmentId: apt.id,
        patient: apt.patient,
        currentTime: apt.time,
        urgency: apt.urgency || 'medium'
      })),
      efficiency: {
        currentGaps: 0,
        suggestedGaps: 0,
        improvement: 'Unable to optimize'
      }
    }
  }
}

/**
 * Analyse tous les rendez-vous d'une clinique et identifie les urgences
 * UTILISE GOOGLE GEMINI (GRATUIT)
 */
export async function analyzeClinicUrgencies(params: {
  clinicId: string
  date: string
  appointments: Array<{
    id: string
    patient: string
    doctor: string
    time: string
    notes: string
  }>
}): Promise<{
  urgentAppointments: Array<{
    appointmentId: string
    patient: string
    doctor: string
    time: string
    urgency: 'high' | 'critical'
    reason: string
    recommendedAction: string
  }>
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
}> {
  const appointmentsList = params.appointments.map(apt => 
    `- ${apt.time}: ${apt.patient} avec ${apt.doctor} - "${apt.notes}"`
  ).join('\n')

  const prompt = `
Analyse tous les rendez-vous d'une clinique pour le ${params.date} et identifie les URGENCES.

RENDEZ-VOUS:
${appointmentsList}

TÂCHE:
1. Analyse chaque rendez-vous pour détecter les urgences CRITICAL et HIGH
2. Identifie les mots-clés d'urgence (douleur thoracique, difficulté respiratoire, etc.)
3. Classe chaque rendez-vous par urgence
4. Donne une action recommandée pour chaque urgence

Retourne UNIQUEMENT un JSON:
{
  "urgentAppointments": [
    {
      "appointmentId": "ID",
      "patient": "nom",
      "doctor": "nom",
      "time": "heure",
      "urgency": "high|critical",
      "reason": "pourquoi urgent",
      "recommendedAction": "action"
    }
  ],
  "summary": {
    "total": nombre,
    "critical": nombre,
    "high": nombre,
    "medium": nombre,
    "low": nombre
  }
}
`

  try {
    const result = await generateJSON(prompt)
    return result
  } catch (error) {
    console.error('Error in analyzeClinicUrgencies:', error)
    return {
      urgentAppointments: [],
      summary: {
        total: params.appointments.length,
        critical: 0,
        high: 0,
        medium: params.appointments.length,
        low: 0
      }
    }
  }
}
