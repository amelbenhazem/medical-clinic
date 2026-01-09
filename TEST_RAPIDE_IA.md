# ⚡ Test Rapide - Vérifier si l'IA Fonctionne

## 🎯 Test en 30 Secondes

### Étape 1 : Vérifier la Configuration

**Le fichier `.env.local` n'existe pas encore. Créez-le :**

1. Créez un fichier `.env.local` à la racine du projet
2. Copiez ce contenu :

```env
# Google Gemini AI (GRATUIT)
GOOGLE_GEMINI_API_KEY=votre-clé-api-ici
```

3. **Obtenez votre clé API gratuite :**
   - Allez sur : https://makersuite.google.com/app/apikey
   - Connectez-vous avec Google
   - Cliquez sur "Create API Key"
   - Copiez la clé
   - Collez-la dans `.env.local` à la place de `votre-clé-api-ici`

### Étape 2 : Redémarrer le Serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez :
npm run dev
```

### Étape 3 : Test Rapide dans le Navigateur

1. **Ouvrez** : http://localhost:3000
2. **Connectez-vous** à l'application
3. **Ouvrez la console** (F12)
4. **Collez ce code** dans la console :

```javascript
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ notes: 'Douleur thoracique depuis ce matin' })
})
.then(r => r.json())
.then(data => {
  if (data.success && data.level) {
    console.log('✅ IA FONCTIONNE !', data)
    alert('✅ IA fonctionne ! Urgence détectée: ' + data.level)
  } else {
    console.log('❌ Erreur:', data)
    alert('❌ Erreur: ' + (data.error || 'Vérifiez la configuration'))
  }
})
.catch(err => {
  console.error('❌ Erreur réseau:', err)
  alert('❌ Erreur réseau. Vérifiez que le serveur tourne.')
})
```

---

## ✅ Résultats Possibles

### ✅ Succès - IA Fonctionne !

Vous verrez :
```
✅ IA FONCTIONNE !
{
  success: true,
  level: "critical",
  reason: "...",
  keywords: [...],
  recommendedAction: "..."
}
```

**→ L'IA fonctionne parfaitement ! 🎉**

---

### ❌ Erreur : "Unauthorized"

**Problème :** Vous n'êtes pas connecté

**Solution :**
1. Connectez-vous à l'application
2. Réessayez le test

---

### ❌ Erreur : "GOOGLE_GEMINI_API_KEY is not defined"

**Problème :** La clé API n'est pas configurée

**Solution :**
1. Créez `.env.local` avec la clé API
2. Redémarrez le serveur (`npm run dev`)
3. Réessayez

---

### ❌ Erreur : "Invalid API key"

**Problème :** La clé API est incorrecte

**Solution :**
1. Vérifiez que vous avez bien copié toute la clé
2. Obtenez une nouvelle clé : https://makersuite.google.com/app/apikey
3. Remplacez dans `.env.local`
4. Redémarrez le serveur

---

## 🎨 Test dans l'Interface (Plus Visuel)

### Test Complet dans le Formulaire

1. **Allez dans** : Rendez-vous → Créer un rendez-vous
2. **Remplissez :**
   - Patient
   - Médecin
   - Service
   - Date
3. **Dans "Notes"**, écrivez :
   ```
   Douleur thoracique depuis ce matin, difficulté à respirer
   ```
4. **Attendez** que les créneaux se chargent
5. **Vous devriez voir** : "Suggestions IA Intelligentes"
6. **Cliquez** sur "🤖 Obtenir Suggestions"

**Si vous voyez :**
- ✅ Badge rouge "URGENCE CRITIQUE"
- ✅ Suggestions de créneaux avec scores
- ✅ Explications pour chaque créneau

**→ L'IA fonctionne ! 🎉**

---

## 🔍 Vérification des Logs

### Console Serveur (Terminal)

Quand vous testez, regardez le terminal où tourne `npm run dev` :

**✅ Succès :**
```
Pas d'erreur visible
```

**❌ Erreur :**
```
Error calling Gemini: Invalid API key
Error in detect-urgency: ...
```

---

## 📋 Checklist Rapide

- [ ] Fichier `.env.local` créé
- [ ] Clé API Google Gemini ajoutée
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Connecté à l'application
- [ ] Test dans la console navigateur effectué
- [ ] Résultat : ✅ ou ❌

---

## 🆘 Si Ça Ne Fonctionne Pas

1. **Vérifiez les logs serveur** (terminal)
2. **Vérifiez la console navigateur** (F12)
3. **Vérifiez que `.env.local` existe** et contient la clé
4. **Vérifiez que vous êtes connecté**
5. **Vérifiez votre connexion internet**

---

## 💡 Astuce

**Le test le plus simple :**

Ouvrez la console (F12) et collez :
```javascript
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ notes: 'Test' })
}).then(r => r.json()).then(console.log)
```

**Si vous voyez `{success: true, level: ...}` → Ça marche ! ✅**
