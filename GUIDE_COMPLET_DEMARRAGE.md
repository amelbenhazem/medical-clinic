# 🚀 Guide Complet - Lancer le Projet et Tester l'IA

## 📋 Étape par Étape (Pour Débutants)

---

## ✅ ÉTAPE 1 : Vérifier les Prérequis

### Vérifier Node.js

Ouvrez PowerShell ou CMD et tapez :

```bash
node --version
```

**Si vous voyez une version (ex: v18.x.x ou v20.x.x) → ✅ OK**
**Si vous voyez "command not found" → Installez Node.js :**
- Téléchargez : https://nodejs.org/
- Installez la version LTS (recommandée)

### Vérifier npm

```bash
npm --version
```

**Si vous voyez une version → ✅ OK**

---

## ✅ ÉTAPE 2 : Installer les Dépendances

### Ouvrir le Terminal dans le Projet

1. Ouvrez PowerShell ou CMD
2. Naviguez vers le projet :

```bash
cd "C:\Users\DELL\Desktop\projet dev\projet-react-fac"
```

### Installer les Packages

```bash
npm install
```

**⏱️ Cela prend 2-5 minutes**

**Vous devriez voir :**
```
added XXX packages
```

---

## ✅ ÉTAPE 3 : Configurer Supabase

### Créer un Projet Supabase (Si pas déjà fait)

1. Allez sur : https://supabase.com
2. Créez un compte (gratuit)
3. Créez un nouveau projet
4. Attendez 2-3 minutes que le projet soit créé

### Récupérer les Clés

1. Dans Supabase, allez dans **Settings** → **API**
2. Copiez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (commence par `eyJ...`)
   - **service_role key** (commence par `eyJ...`)

---

## ✅ ÉTAPE 4 : Configurer les Variables d'Environnement

### Créer le Fichier .env.local

1. Dans le dossier du projet, créez un fichier nommé : `.env.local`
2. Ouvrez-le avec un éditeur de texte (Notepad, VS Code, etc.)
3. Ajoutez ce contenu :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-ici
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role-ici

# Google Gemini AI (GRATUIT)
GOOGLE_GEMINI_API_KEY=votre-clé-gemini-ici
```

4. **Remplacez** les valeurs par vos vraies clés :
   - `NEXT_PUBLIC_SUPABASE_URL` → Votre Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Votre anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → Votre service_role key
   - `GOOGLE_GEMINI_API_KEY` → Votre clé Gemini (voir étape suivante)

---

## ✅ ÉTAPE 5 : Obtenir la Clé API Google Gemini (GRATUIT)

1. Allez sur : https://makersuite.google.com/app/apikey
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"**
4. **C'est GRATUIT !** ✅
5. Copiez la clé générée
6. Collez-la dans `.env.local` à la place de `votre-clé-gemini-ici`

**Exemple de clé :** `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

---

## ✅ ÉTAPE 6 : Lancer le Projet

### Dans le Terminal

Assurez-vous d'être dans le bon dossier :

```bash
cd "C:\Users\DELL\Desktop\projet dev\projet-react-fac"
```

### Lancer le Serveur de Développement

```bash
npm run dev
```

**Vous devriez voir :**
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

**✅ Le serveur est lancé !**

---

## ✅ ÉTAPE 7 : Ouvrir l'Application

1. Ouvrez votre navigateur (Chrome, Firefox, Edge)
2. Allez sur : **http://localhost:3000**
3. Vous devriez voir la page de connexion

---

## ✅ ÉTAPE 8 : Créer un Compte et Se Connecter

### Créer un Compte

1. Cliquez sur **"Register"** ou **"S'inscrire"**
2. Remplissez :
   - Email
   - Mot de passe
   - Nom complet
   - Téléphone
   - Rôle (choisissez **admin** pour tester)
3. Cliquez sur **"S'inscrire"**

### Se Connecter

1. Allez sur **"Login"** ou **"Connexion"**
2. Entrez votre email et mot de passe
3. Cliquez sur **"Se connecter"**

**✅ Vous êtes connecté !**

---

## ✅ ÉTAPE 9 : Tester l'IA - Test Rapide

### Test 1 : Dans la Console du Navigateur

1. **Ouvrez la console** : Appuyez sur **F12** (ou Clic droit → Inspecter → Console)
2. **Collez ce code** dans la console :

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
    alert('✅ IA fonctionne ! Urgence: ' + data.level)
  } else {
    console.log('❌ Erreur:', data)
    alert('❌ Erreur: ' + (data.error || 'Vérifiez la config'))
  }
})
.catch(err => {
  console.error('❌ Erreur:', err)
  alert('❌ Erreur réseau')
})
```

3. **Appuyez sur Entrée**

**Résultat attendu :**
- Une alerte apparaît : "✅ IA fonctionne ! Urgence: critical"
- Dans la console : `{success: true, level: "critical", ...}`

**✅ Si vous voyez ça → L'IA fonctionne ! 🎉**

---

## ✅ ÉTAPE 10 : Tester dans l'Interface (Test Complet)

### Créer une Clinique (Si Admin)

1. Allez dans **Dashboard Admin**
2. Créez une clinique (si pas déjà fait)
3. Ajoutez des services
4. Ajoutez du personnel (médecins)

### Créer un Patient

1. Allez dans **Patients**
2. Créez un nouveau patient

### Tester les Suggestions IA

1. Allez dans **Rendez-vous** → **Créer un rendez-vous**
2. **Remplissez :**
   - Patient : Sélectionnez un patient
   - Médecin : Sélectionnez un médecin
   - Service : Sélectionnez un service
   - Date : Choisissez une date
3. **Dans "Notes"**, écrivez :
   ```
   Douleur thoracique depuis ce matin, difficulté à respirer
   ```
4. **Attendez** que les créneaux disponibles se chargent
5. **Vous devriez voir** un nouveau composant : **"Suggestions IA Intelligentes"**
6. **Cliquez sur** : **"🤖 Obtenir Suggestions"**

**Ce qui devrait apparaître :**
- ✅ Badge rouge : **"URGENCE CRITIQUE"**
- ✅ Message : "Consultation immédiate requise"
- ✅ Suggestions de créneaux avec scores (ex: 10:00 AM - Score: 9/10)
- ✅ Explications pour chaque créneau
- ✅ Bouton "Utiliser" pour chaque suggestion

**✅ Si vous voyez tout ça → L'IA fonctionne parfaitement ! 🎉**

---

## 🐛 Dépannage

### Erreur : "Cannot find module"

**Solution :**
```bash
npm install
```

### Erreur : "Port 3000 already in use"

**Solution :**
- Arrêtez l'autre processus qui utilise le port 3000
- Ou changez le port : `npm run dev -- -p 3001`

### Erreur : "Unauthorized" dans le test IA

**Solution :**
- Assurez-vous d'être connecté à l'application
- Rafraîchissez la page

### Erreur : "GOOGLE_GEMINI_API_KEY is not defined"

**Solution :**
1. Vérifiez que `.env.local` existe
2. Vérifiez que la clé est bien dedans
3. Redémarrez le serveur (`Ctrl+C` puis `npm run dev`)

### Erreur : "Invalid API key"

**Solution :**
1. Vérifiez que la clé Gemini est correcte
2. Obtenez une nouvelle clé : https://makersuite.google.com/app/apikey
3. Remplacez dans `.env.local`
4. Redémarrez

### Le serveur ne démarre pas

**Solution :**
1. Vérifiez que vous êtes dans le bon dossier
2. Vérifiez que `node_modules` existe (sinon : `npm install`)
3. Vérifiez les erreurs dans le terminal

---

## 📋 Checklist Complète

- [ ] Node.js installé (`node --version`)
- [ ] npm installé (`npm --version`)
- [ ] Dépendances installées (`npm install`)
- [ ] Projet Supabase créé
- [ ] Clés Supabase récupérées
- [ ] Fichier `.env.local` créé avec toutes les clés
- [ ] Clé API Google Gemini obtenue (gratuit)
- [ ] Serveur lancé (`npm run dev`)
- [ ] Application ouverte (http://localhost:3000)
- [ ] Compte créé et connecté
- [ ] Test IA dans la console effectué
- [ ] Test IA dans l'interface effectué

---

## 🎯 Résumé des Commandes

```bash
# 1. Aller dans le projet
cd "C:\Users\DELL\Desktop\projet dev\projet-react-fac"

# 2. Installer les dépendances (première fois seulement)
npm install

# 3. Lancer le serveur
npm run dev

# 4. Ouvrir dans le navigateur
# http://localhost:3000
```

---

## 🆘 Besoin d'Aide ?

1. **Vérifiez les logs** dans le terminal
2. **Vérifiez la console navigateur** (F12)
3. **Vérifiez que `.env.local` existe** et contient toutes les clés
4. **Consultez** `GUIDE_DEMARRAGE.md` pour plus de détails

---

**🎉 Suivez ces étapes dans l'ordre et vous pourrez tester l'IA !**
