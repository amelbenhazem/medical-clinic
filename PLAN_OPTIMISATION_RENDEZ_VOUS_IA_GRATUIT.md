# 🎯 Plan d'Implémentation - Optimisation Intelligente des Rendez-vous (IA GRATUITE)

## 📋 Vue d'Ensemble

Ce document explique comment implémenter l'optimisation intelligente des rendez-vous en utilisant **des solutions IA 100% GRATUITES**.

---

## 🆓 Solutions IA Gratuites Disponibles

### Option 1 : Google Gemini (Recommandé) ⭐

**Avantages :**
- ✅ **100% Gratuit** jusqu'à 60 requêtes/minute
- ✅ Très performant (Gemini Pro)
- ✅ Facile à intégrer
- ✅ Pas besoin de serveur local
- ✅ API simple et bien documentée

**Limites :**
- 60 requêtes/minute (largement suffisant pour une clinique)
- Pas de données stockées (conforme RGPD)

**Coût :** **GRATUIT** ✅

### Option 2 : Ollama (Local)

**Avantages :**
- ✅ **100% Gratuit** et open source
- ✅ Complètement privé (données restent locales)
- ✅ Pas de limite de requêtes
- ✅ Fonctionne hors ligne

**Inconvénients :**
- ⚠️ Nécessite un serveur local
- ⚠️ Plus complexe à configurer
- ⚠️ Nécessite ressources serveur (RAM, CPU)

**Coût :** **GRATUIT** ✅ (mais nécessite serveur)

### Option 3 : Hugging Face Inference API

**Avantages :**
- ✅ Gratuit pour usage modéré
- ✅ Modèles open source
- ✅ Bonne communauté

**Inconvénients :**
- ⚠️ Moins performant que Gemini
- ⚠️ Limites de requêtes

**Coût :** **GRATUIT** ✅ (avec limites)

---

## 🎯 Recommandation : Google Gemini

**Pourquoi Gemini ?**
- Le plus simple à intégrer
- Performances excellentes
- Gratuit et suffisant pour une clinique
- Pas besoin d'infrastructure supplémentaire

---

## 🏗️ Architecture avec Google Gemini

### Structure des Fichiers

```
lib/
├── ai/
│   ├── gemini-client.ts         # Client Google Gemini (GRATUIT)
│   ├── services/
│   │   └── appointment-optimizer.ts
│   └── prompts/
│       └── appointment-optimization.ts

app/
├── api/
│   └── ai/
│       └── optimize-appointments/
│           └── route.ts

components/
├── ai/
│   ├── smart-slot-suggestions.tsx
│   ├── appointment-priority-badge.tsx
│   └── optimize-schedule-button.tsx
```

---

## 💻 Implémentation avec Google Gemini (GRATUIT)

### Étape 1 : Installation

```bash
npm install @google/generative-ai
```

### Étape 2 : Obtenir la Clé API Gratuite

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. **C'est gratuit !** ✅

### Étape 3 : Configuration

**Fichier : `.env.local`**

```env
# Google Gemini (GRATUIT)
GOOGLE_GEMINI_API_KEY=your-api-key-here
```

**Fichier : `lib/ai/gemini-client.ts`**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialiser le client Gemini (GRATUIT)
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY!
)

// Modèle gratuit : gemini-pro
export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-pro' 
})

export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error calling Gemini:', error)
    throw error
  }
}

// Fonction pour parser la réponse JSON
export async function generateJSON(prompt: string): Promise<any> {
  const text = await generateText(prompt + '\n\nRetourne uniquement du JSON valide, sans markdown.')
  try {
    // Nettoyer la réponse (enlever markdown si présent)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Error parsing JSON:', error)
    throw new Error('Invalid JSON response from AI')
  }
}
```

---

## 🧠 Service d'Optimisation (GRATUIT)

**Fichier : `lib/ai/services/appointment-optimizer.ts`**

```typescript
import { generateJSON, generateText } from '../gemini-client'

/**
 * Suggère les meilleurs créneaux pour un rendez-vous
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
  patientHistory?: {
    previousAppointments: number
    averageDuration: number
    commonIssues: string[]
  }
}) {
  const prompt = `
Tu es un assistant IA pour une clinique médicale. 
Analyse les informations suivantes et suggère les meilleurs créneaux pour un rendez-vous.

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

CRÉNEAUX DISPONIBLES: ${params.availableSlots.join(', ')}

TÂCHE:
1. Analyse l'urgence du rendez-vous basée sur les notes
2. Suggère les 3 meilleurs créneaux avec un score de 1 à 10
3. Donne une raison pour chaque suggestion
4. Détecte le niveau d'urgence (low, medium, high, critical)

Retourne UNIQUEMENT un JSON avec cette structure:
{
  "urgency": "low|medium|high|critical",
  "urgency_reason": "explication",
  "suggested_slots": [
    {
      "time": "HH:MM:SS",
      "score": 1-10,
      "reason": "explication"
    }
  ],
  "predicted_duration": nombre,
  "duration_reason": "explication"
}
`

  try {
    const result = await generateJSON(prompt)
    return result
  } catch (error) {
    console.error('Error in suggestOptimalSlots:', error)
    // Fallback: retourner les créneaux disponibles sans optimisation
    return {
      urgency: 'medium',
      urgency_reason: 'Unable to analyze',
      suggested_slots: params.availableSlots.slice(0, 3).map(slot => ({
        time: slot,
        score: 5,
        reason: 'Available slot'
      })),
      predicted_duration: params.serviceDuration,
      duration_reason: 'Standard duration'
    }
  }
}

/**
 * Détecte le niveau d'urgence d'un rendez-vous
 * UTILISE GOOGLE GEMINI (GRATUIT)
 */
export async function detectUrgency(params: {
  notes: string
  symptoms?: string
  patientHistory?: string
}): Promise<{
  level: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  keywords: string[]
}> {
  const prompt = `
Analyse les informations suivantes et détecte le niveau d'urgence d'un rendez-vous médical.

NOTES: "${params.notes}"
SYMPTÔMES: "${params.symptoms || 'Non spécifiés'}"
HISTORIQUE: "${params.patientHistory || 'Aucun historique disponible'}"

Niveaux d'urgence:
- critical: Urgence vitale (douleur thoracique, difficulté respiratoire, perte de conscience, etc.)
- high: Urgence importante (douleur intense, fièvre élevée, saignement, etc.)
- medium: Urgence modérée (symptômes persistants, douleur modérée, etc.)
- low: Non urgent (contrôle de routine, renouvellement, etc.)

Retourne UNIQUEMENT un JSON:
{
  "level": "low|medium|high|critical",
  "reason": "explication détaillée",
  "keywords": ["mot-clé1", "mot-clé2"]
}
`

  try {
    const result = await generateJSON(prompt)
    return result
  } catch (error) {
    console.error('Error in detectUrgency:', error)
    return {
      level: 'medium' as const,
      reason: 'Unable to analyze',
      keywords: []
    }
  }
}

/**
 * Prédit la durée réelle d'une consultation
 * UTILISE GOOGLE GEMINI (GRATUIT)
 */
export async function predictAppointmentDuration(params: {
  patientId: string
  serviceDuration: number
  notes: string
  patientHistory?: {
    averageDuration: number
    consultationCount: number
    complexity: 'simple' | 'moderate' | 'complex'
  }
}): Promise<{
  predictedDuration: number
  reason: string
  confidence: 'low' | 'medium' | 'high'
}> {
  const prompt = `
Prédit la durée réelle d'une consultation médicale.

DURÉE STANDARD DU SERVICE: ${params.serviceDuration} minutes

NOTES: "${params.notes}"

HISTORIQUE PATIENT:
- Nombre de consultations: ${params.patientHistory?.consultationCount || 0}
- Durée moyenne historique: ${params.patientHistory?.averageDuration || params.serviceDuration} minutes
- Complexité: ${params.patientHistory?.complexity || 'moderate'}

Analyse:
1. La complexité mentionnée dans les notes
2. Le nombre de problèmes à traiter
3. L'historique du patient
4. Le type de service

Retourne UNIQUEMENT un JSON:
{
  "predictedDuration": nombre,
  "reason": "explication",
  "confidence": "low|medium|high"
}
`

  try {
    const result = await generateJSON(prompt)
    return result
  } catch (error) {
    console.error('Error in predictAppointmentDuration:', error)
    return {
      predictedDuration: params.serviceDuration,
      reason: 'Using standard duration',
      confidence: 'low' as const
    }
  }
}

/**
 * Optimise le planning d'un médecin pour une journée
 * UTILISE GOOGLE GEMINI (GRATUIT)
 */
export async function optimizeDoctorSchedule(params: {
  doctorId: string
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
    type: 'move' | 'group' | 'reschedule'
    description: string
    currentAppointment?: string
    suggestedTime?: string
    reason: string
  }>
  efficiency: {
    currentGaps: number
    suggestedGaps: number
    improvement: string
  }
}> {
  const prompt = `
Optimise le planning d'un médecin pour le ${params.date}.

RENDEZ-VOUS ACTUELS:
${params.appointments.map(apt => 
  `- ${apt.time} (${apt.duration} min): ${apt.patient} - "${apt.notes}" [Urgence: ${apt.urgency || 'medium'}]`
).join('\n')}

CRÉNEAUX DISPONIBLES: ${params.availableSlots.join(', ')}

TÂCHE:
Analyse le planning et suggère des optimisations pour:
1. Réduire les temps morts
2. Regrouper les rendez-vous similaires
3. Prioriser les urgences
4. Optimiser l'utilisation du temps

Retourne UNIQUEMENT un JSON:
{
  "suggestions": [
    {
      "type": "move|group|reschedule",
      "description": "description de l'action",
      "currentAppointment": "ID ou heure",
      "suggestedTime": "nouvelle heure",
      "reason": "pourquoi cette optimisation"
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
    return result
  } catch (error) {
    console.error('Error in optimizeDoctorSchedule:', error)
    return {
      suggestions: [],
      efficiency: {
        currentGaps: 0,
        suggestedGaps: 0,
        improvement: 'Unable to optimize'
      }
    }
  }
}
```

---

## 🔌 API Route (GRATUIT)

**Fichier : `app/api/ai/optimize-appointments/suggest-slots/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { suggestOptimalSlots } from '@/lib/ai/services/appointment-optimizer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Vérifier authentification
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      patient_id,
      doctor_id,
      service_id,
      date,
      notes = '',
      available_slots
    } = body

    if (!patient_id || !doctor_id || !service_id || !date || !available_slots) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Récupérer les informations nécessaires
    const [patientData, doctorData, serviceData] = await Promise.all([
      supabaseAdmin
        .from('patients')
        .select('first_name, last_name')
        .eq('id', patient_id)
        .single(),
      supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', doctor_id)
        .single(),
      supabaseAdmin
        .from('services')
        .select('name, duration_minutes')
        .eq('id', service_id)
        .single()
    ])

    // Récupérer l'historique du patient (optionnel)
    const { data: consultations } = await supabaseAdmin
      .from('consultations')
      .select('created_at, symptoms, diagnosis')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('start_time, end_time, service:services(duration_minutes)')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculer la durée moyenne
    const avgDuration = appointments?.length > 0
      ? appointments.reduce((sum, apt) => {
          const duration = Array.isArray(apt.service) 
            ? apt.service[0]?.duration_minutes 
            : apt.service?.duration_minutes
          return sum + (duration || 30)
        }, 0) / appointments.length
      : serviceData.data?.duration_minutes || 30

    // Appeler l'IA (GRATUIT - Google Gemini)
    const suggestions = await suggestOptimalSlots({
      patientId: patient_id,
      patientName: `${patientData.data?.first_name} ${patientData.data?.last_name}`,
      doctorId: doctor_id,
      doctorName: doctorData.data?.full_name || 'Doctor',
      serviceId: service_id,
      serviceName: serviceData.data?.name || 'Service',
      serviceDuration: serviceData.data?.duration_minutes || 30,
      date,
      notes,
      availableSlots: available_slots,
      patientHistory: {
        previousAppointments: consultations?.length || 0,
        averageDuration: avgDuration,
        commonIssues: consultations?.map(c => c.symptoms || '').filter(Boolean) || []
      }
    })

    return NextResponse.json({
      success: true,
      ...suggestions
    })
  } catch (error: any) {
    console.error('Error in suggest-slots:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 📦 Installation Complète

### 1. Installer la dépendance

```bash
npm install @google/generative-ai
```

### 2. Obtenir la clé API gratuite

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous
3. Créez une clé API (gratuit)

### 3. Ajouter dans `.env.local`

```env
# Google Gemini (GRATUIT)
GOOGLE_GEMINI_API_KEY=votre-clé-api-gratuite
```

### 4. Structure complète

```
lib/ai/
├── gemini-client.ts              # Client Gemini (GRATUIT)
├── services/
│   └── appointment-optimizer.ts  # Services d'optimisation
└── prompts/
    └── appointment-optimization.ts

app/api/ai/optimize-appointments/
├── suggest-slots/
│   └── route.ts
├── detect-urgency/
│   └── route.ts
├── predict-duration/
│   └── route.ts
└── optimize-schedule/
    └── route.ts
```

---

## 💰 Coûts

### Google Gemini
- **Coût : GRATUIT** ✅
- **Limite :** 60 requêtes/minute (largement suffisant)
- **Pas de limite mensuelle** pour usage modéré
- **Parfait pour une clinique** 🎯

---

## 🚀 Démarrage Rapide

### Étape 1 : Installation

```bash
npm install @google/generative-ai
```

### Étape 2 : Configuration

1. Obtenir clé API gratuite : https://makersuite.google.com/app/apikey
2. Ajouter dans `.env.local` : `GOOGLE_GEMINI_API_KEY=...`

### Étape 3 : Créer les fichiers

1. `lib/ai/gemini-client.ts` (client Gemini)
2. `lib/ai/services/appointment-optimizer.ts` (services)
3. `app/api/ai/optimize-appointments/suggest-slots/route.ts` (API)

### Étape 4 : Tester

```typescript
// Test simple
import { generateText } from '@/lib/ai/gemini-client'

const response = await generateText('Bonjour, ça va ?')
console.log(response) // Devrait fonctionner !
```

---

## ✅ Avantages de Google Gemini (GRATUIT)

- ✅ **100% Gratuit** pour usage clinique
- ✅ **Performant** (Gemini Pro)
- ✅ **Simple** à intégrer
- ✅ **Pas de serveur** nécessaire
- ✅ **Limite généreuse** (60 req/min)
- ✅ **Conforme RGPD** (pas de stockage)

---

## 🎯 Prochaines Étapes

1. **Valider** cette approche gratuite
2. **Obtenir** la clé API Google Gemini (gratuit)
3. **Commencer** l'implémentation

**Voulez-vous que je commence l'implémentation maintenant avec Google Gemini (GRATUIT) ?** 🚀
