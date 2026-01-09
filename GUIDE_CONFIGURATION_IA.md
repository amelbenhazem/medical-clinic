# 🔧 Guide de Configuration - IA Gratuite (Google Gemini)

## 📋 Configuration Rapide

### Étape 1 : Obtenir la Clé API Gratuite

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"**
4. **C'est GRATUIT !** ✅
5. Copiez la clé API générée

### Étape 2 : Ajouter la Clé dans le Projet

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```env
# Google Gemini API (GRATUIT)
GOOGLE_GEMINI_API_KEY=votre-clé-api-ici
```

**⚠️ Important :** Ne commitez JAMAIS ce fichier dans Git (il est déjà dans `.gitignore`)

### Étape 3 : Vérifier l'Installation

La dépendance `@google/generative-ai` est déjà installée.

Pour vérifier :
```bash
npm list @google/generative-ai
```

### Étape 4 : Redémarrer le Serveur

```bash
npm run dev
```

---

## ✅ Fonctionnalités Disponibles

### 1. Détection d'Urgence
- **Route :** `POST /api/ai/optimize-appointments/detect-urgency`
- Analyse les notes et symptômes
- Détecte le niveau d'urgence (low, medium, high, critical)

### 2. Suggestions de Créneaux Intelligents
- **Route :** `POST /api/ai/optimize-appointments/suggest-slots`
- Suggère les meilleurs créneaux en priorisant les urgences
- Prend en compte l'historique du patient

### 3. Optimisation du Planning Médecin
- **Route :** `POST /api/ai/optimize-appointments/optimize-schedule`
- Optimise le planning en priorisant les urgences
- Réorganise les rendez-vous pour efficacité maximale

### 4. Analyse des Urgences Clinique
- **Route :** `POST /api/ai/optimize-appointments/analyze-urgencies`
- Analyse tous les rendez-vous d'une clinique
- Identifie les urgences critiques

---

## 🎨 Utilisation dans l'Interface

### Dans le Formulaire de Rendez-vous

Le composant `SmartSlotSuggestions` s'affiche automatiquement quand :
- Patient sélectionné
- Médecin sélectionné
- Service sélectionné
- Date sélectionnée
- Créneaux disponibles

**Fonctionnalités :**
- Bouton "Obtenir Suggestions" pour générer des suggestions IA
- Affichage du niveau d'urgence détecté
- Suggestions de créneaux avec scores
- Bouton "Utiliser" pour sélectionner directement un créneau

### Badge d'Urgence

Le composant `AppointmentPriorityBadge` affiche :
- **CRITICAL** : Rouge (urgence vitale)
- **HIGH** : Orange (urgence importante)
- **MEDIUM** : Jaune (urgence modérée)
- **LOW** : Vert (non urgent)

---

## 🧪 Test Rapide

### Test de Détection d'Urgence

```bash
curl -X POST http://localhost:3000/api/ai/optimize-appointments/detect-urgency \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Douleur thoracique depuis ce matin, difficulté à respirer"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "level": "critical",
  "reason": "Douleur thoracique et difficulté respiratoire détectées - urgence vitale",
  "keywords": ["douleur thoracique", "difficulté respiratoire"],
  "recommendedAction": "Consultation immédiate requise"
}
```

---

## 🔍 Dépannage

### Erreur : "GOOGLE_GEMINI_API_KEY is not defined"

**Solution :**
1. Vérifiez que `.env.local` existe
2. Vérifiez que la clé est bien définie
3. Redémarrez le serveur (`npm run dev`)

### Erreur : "Invalid API key"

**Solution :**
1. Vérifiez que la clé API est correcte
2. Vérifiez que vous avez bien copié toute la clé
3. Obtenez une nouvelle clé si nécessaire

### Erreur : "Rate limit exceeded"

**Solution :**
- Google Gemini permet 60 requêtes/minute (gratuit)
- Attendez quelques secondes et réessayez
- Pour usage intensif, considérez un cache

### L'IA ne répond pas ou erreur de parsing

**Solution :**
1. Vérifiez les logs dans la console serveur
2. Vérifiez que la clé API est valide
3. Vérifiez votre connexion internet

---

## 📊 Limites Gratuites

- **60 requêtes/minute** (largement suffisant pour une clinique)
- **Pas de limite mensuelle** pour usage modéré
- **Gratuit à vie** pour usage raisonnable

---

## 🚀 Prochaines Étapes

1. ✅ Configuration terminée
2. ✅ Testez les fonctionnalités dans l'interface
3. ✅ Utilisez les suggestions IA lors de la création de rendez-vous
4. ✅ Surveillez les urgences détectées

**Tout est prêt ! L'IA est maintenant intégrée et fonctionnelle. 🎉**
