# 🧪 Guide de Test - Vérifier que l'IA Fonctionne

## ✅ Checklist Avant de Tester

- [ ] Clé API Google Gemini configurée dans `.env.local`
- [ ] Serveur démarré (`npm run dev`)
- [ ] Vous êtes connecté dans l'application
- [ ] Vous avez au moins un patient, un médecin et un service créés

---

## 🚀 Test Rapide (2 minutes)

### Test 1 : Vérifier la Configuration

**Vérifier que la clé API est bien configurée :**

1. Ouvrez `.env.local` à la racine du projet
2. Vérifiez que vous avez :
   ```env
   GOOGLE_GEMINI_API_KEY=votre-clé-ici
   ```
3. Si la clé n'est pas là, suivez `GUIDE_CONFIGURATION_IA.md`

### Test 2 : Test Simple de Détection d'Urgence

**Dans votre navigateur (console développeur) :**

1. Ouvrez l'application : `http://localhost:3000`
2. Ouvrez la console (F12)
3. Testez directement l'API :

```javascript
// Collez ceci dans la console du navigateur
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    notes: 'Douleur thoracique depuis ce matin, difficulté à respirer'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Résultat IA:', data))
.catch(err => console.error('❌ Erreur:', err))
```

**Résultat attendu :**
```json
{
  "success": true,
  "level": "critical",
  "reason": "...",
  "keywords": ["douleur thoracique", "difficulté respiratoire"],
  "recommendedAction": "Consultation immédiate requise"
}
```

**Si vous voyez une erreur :**
- ❌ `Unauthorized` → Vous n'êtes pas connecté
- ❌ `GOOGLE_GEMINI_API_KEY is not defined` → Clé API manquante
- ❌ `Invalid API key` → Clé API incorrecte

---

## 🎯 Test Complet dans l'Interface

### Test 3 : Test dans le Formulaire de Rendez-vous

1. **Connectez-vous** à l'application
2. **Allez dans** : Rendez-vous → Créer un rendez-vous
3. **Remplissez le formulaire :**
   - Sélectionnez un patient
   - Sélectionnez un médecin
   - Sélectionnez un service
   - Sélectionnez une date
4. **Dans le champ "Notes"**, écrivez :
   ```
   Douleur thoracique depuis ce matin, difficulté à respirer
   ```
5. **Attendez** que les créneaux disponibles se chargent
6. **Vous devriez voir** un nouveau composant "Suggestions IA Intelligentes"
7. **Cliquez sur** "🤖 Obtenir Suggestions"

**Ce qui devrait se passer :**
- ✅ Un badge rouge "URGENCE CRITIQUE" apparaît
- ✅ Des suggestions de créneaux avec scores apparaissent
- ✅ Le créneau le plus tôt est recommandé (⭐)
- ✅ Des explications sont données pour chaque créneau

**Si ça ne fonctionne pas :**
- Vérifiez la console du navigateur (F12) pour les erreurs
- Vérifiez la console du serveur (terminal) pour les erreurs
- Vérifiez que la clé API est bien configurée

---

## 🔍 Test Détaillé par Fonctionnalité

### Test 4 : Détection d'Urgence (Différents Niveaux)

Testez avec différents textes pour voir les différents niveaux :

**Test CRITICAL :**
```javascript
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notes: 'Douleur thoracique intense, perte de conscience'
  })
}).then(r => r.json()).then(console.log)
```
**Attendu :** `"level": "critical"`

**Test HIGH :**
```javascript
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notes: 'Fièvre élevée 40°C, vomissements persistants'
  })
}).then(r => r.json()).then(console.log)
```
**Attendu :** `"level": "high"`

**Test MEDIUM :**
```javascript
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notes: 'Toux depuis 3 jours, légère fièvre'
  })
}).then(r => r.json()).then(console.log)
```
**Attendu :** `"level": "medium"`

**Test LOW :**
```javascript
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notes: 'Contrôle de routine, renouvellement ordonnance'
  })
}).then(r => r.json()).then(console.log)
```
**Attendu :** `"level": "low"`

---

### Test 5 : Suggestions de Créneaux

**Prérequis :** Vous devez avoir des créneaux disponibles

```javascript
// Remplacez les IDs par vos vrais IDs
fetch('/api/ai/optimize-appointments/suggest-slots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patient_id: 'votre-patient-id',
    doctor_id: 'votre-doctor-id',
    service_id: 'votre-service-id',
    date: '2024-12-20',
    notes: 'Douleur thoracique',
    available_slots: ['10:00:00', '14:00:00', '16:00:00']
  })
}).then(r => r.json()).then(console.log)
```

**Résultat attendu :**
```json
{
  "success": true,
  "urgency": "critical",
  "urgency_reason": "...",
  "suggested_slots": [
    {
      "time": "10:00:00",
      "score": 9,
      "reason": "...",
      "priority": "high"
    }
  ],
  "predicted_duration": 30,
  "duration_reason": "...",
  "recommendedAction": "..."
}
```

---

## 🐛 Dépannage

### Problème : "Unauthorized"

**Solution :**
- Connectez-vous à l'application
- Vérifiez que votre session est active

### Problème : "GOOGLE_GEMINI_API_KEY is not defined"

**Solution :**
1. Créez/modifiez `.env.local`
2. Ajoutez : `GOOGLE_GEMINI_API_KEY=votre-clé`
3. Redémarrez le serveur (`npm run dev`)

### Problème : "Invalid API key"

**Solution :**
1. Vérifiez que la clé est correcte
2. Obtenez une nouvelle clé : https://makersuite.google.com/app/apikey
3. Remplacez dans `.env.local`
4. Redémarrez

### Problème : "Rate limit exceeded"

**Solution :**
- Attendez 1 minute (limite : 60 req/min)
- Réessayez

### Problème : L'IA ne répond pas ou erreur de parsing

**Solution :**
1. Vérifiez les logs serveur (terminal)
2. Vérifiez votre connexion internet
3. Vérifiez que la clé API est valide

### Problème : Le composant IA n'apparaît pas

**Solution :**
1. Vérifiez que tous les champs sont remplis (patient, médecin, service, date)
2. Vérifiez que des créneaux sont disponibles
3. Vérifiez la console navigateur pour erreurs

---

## 📊 Vérification des Logs

### Console Serveur (Terminal)

Quand vous testez, vous devriez voir dans le terminal :

```
✅ Succès :
  - Pas d'erreur
  - Réponse de l'IA reçue

❌ Erreur :
  - "Error calling Gemini: ..."
  - "Invalid API key"
  - "Rate limit exceeded"
```

### Console Navigateur (F12)

Quand vous testez, vous devriez voir :

```
✅ Succès :
  - Requête réussie (200)
  - Données reçues

❌ Erreur :
  - 401 Unauthorized
  - 500 Internal Server Error
  - Erreur de réseau
```

---

## ✅ Checklist de Test Complet

- [ ] Test 1 : Configuration vérifiée
- [ ] Test 2 : Détection d'urgence fonctionne (console)
- [ ] Test 3 : Interface fonctionne (formulaire)
- [ ] Test 4 : Différents niveaux d'urgence détectés
- [ ] Test 5 : Suggestions de créneaux fonctionnent
- [ ] Badge d'urgence s'affiche correctement
- [ ] Suggestions IA s'affichent avec scores
- [ ] Bouton "Utiliser" fonctionne

---

## 🎯 Test Rapide en 30 Secondes

**Le test le plus rapide :**

1. Ouvrez la console navigateur (F12)
2. Collez ce code :

```javascript
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ notes: 'Douleur thoracique' })
})
.then(r => r.json())
.then(data => {
  if (data.success && data.level) {
    console.log('✅ IA FONCTIONNE !', data)
  } else {
    console.log('❌ Erreur:', data)
  }
})
```

**Si vous voyez `✅ IA FONCTIONNE !` → Tout est OK !**
**Si vous voyez une erreur → Suivez le dépannage ci-dessus**

---

## 📝 Notes Importantes

1. **L'IA nécessite une connexion internet** (appel à Google Gemini)
2. **La clé API doit être valide** (obtenez-la gratuitement)
3. **Vous devez être connecté** pour utiliser les API
4. **Les tests peuvent prendre 2-5 secondes** (appel API)

---

**Besoin d'aide ? Consultez `GUIDE_CONFIGURATION_IA.md` pour la configuration initiale.**
