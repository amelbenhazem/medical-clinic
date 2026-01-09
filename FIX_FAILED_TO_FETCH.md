# 🔧 FIX - Erreur "Failed to fetch" - Configuration Supabase

## ❌ Problème Actuel

```
Failed to fetch
```

**Cause :** Le fichier `.env.local` contient encore les valeurs par défaut (`votre-projet.supabase.co`) au lieu de vos vraies clés Supabase.

---

## ✅ SOLUTION - 3 Étapes Simples

### ÉTAPE 1 : Obtenir vos Clés Supabase

#### A. Si vous avez DÉJÀ un projet Supabase :

1. Allez sur : **https://supabase.com/dashboard**
2. Connectez-vous
3. **Sélectionnez votre projet** dans la liste
4. Allez dans : **Settings** (⚙️) → **API**
5. Vous verrez 3 choses importantes :

   **📋 Project URL :**
   ```
   https://xxxxx.supabase.co
   ```
   → Copiez cette URL complète

   **🔑 anon public :**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZrY2d5cW13c2Z6d2tqeGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA3NzQsImV4cCI6MjA3ODUxNjc3NH0.weMQQdTHTB-zTnYxaFqW-k8lsy9onXQLLst6qcMqtcc
   ```
   → Copiez cette clé complète (elle est longue !)

   **🔐 service_role :**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZrY2d5cW13c2Z6d2tqeGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0MDc3NCwiZXhwIjoyMDc4NTE2Nzc0fQ.3nUnuDSDsqhVGRWX7GPsROhOxH3JQQex-LZTqZrgvEo
   ```
   → Copiez cette clé complète (⚠️ SECRET - ne la partagez pas !)

#### B. Si vous N'AVEZ PAS de projet Supabase :

1. Allez sur : **https://supabase.com**
2. Cliquez sur **"Start your project"** ou **"Sign up"**
3. Créez un compte (gratuit)
4. Cliquez sur **"New Project"**
5. Remplissez :
   - **Name** : `medical-clinic` (ou votre choix)
   - **Database Password** : Choisissez un mot de passe fort (⚠️ Notez-le !)
   - **Region** : Choisissez la région la plus proche
6. Cliquez sur **"Create new project"**
7. **⏱️ Attendez 2-3 minutes** que le projet soit créé
8. Une fois créé, suivez les étapes A ci-dessus

---

### ÉTAPE 2 : Mettre à Jour .env.local

1. **Ouvrez le fichier `.env.local`** dans le projet
   - Avec Notepad : `notepad .env.local` dans PowerShell
   - Avec VS Code : Ouvrez le fichier

2. **Remplacez les valeurs** par vos vraies clés :

**AVANT (actuel - incorrect) :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-ici
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role-ici
```

**APRÈS (à remplir avec vos vraies valeurs) :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://aaefkcgyqmwsfzwkjxkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZrY2d5cW13c2Z6d2tqeGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA3NzQsImV4cCI6MjA3ODUxNjc3NH0.weMQQdTHTB-zTnYxaFqW-k8lsy9onXQLLst6qcMqtcc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZrY2d5cW13c2Z6d2tqeGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0MDc3NCwiZXhwIjoyMDc4NTE2Nzc0fQ.3nUnuDSDsqhVGRWX7GPsROhOxH3JQQex-LZTqZrgvEo
```

**⚠️ IMPORTANT :**
- Remplacez `https://aaefkcgyqmwsfzwkjxkf.supabase.co` par VOTRE vraie URL
- Remplacez les clés `eyJ...` par VOS vraies clés
- **Pas d'espaces** autour du `=`
- **Pas de guillemets** autour des valeurs
- Copiez les clés **en entier** (elles sont longues !)

3. **Sauvegardez** le fichier (Ctrl+S)

---

### ÉTAPE 3 : Redémarrer le Serveur

1. **Arrêtez le serveur** :
   - Dans le terminal où tourne `npm run dev`
   - Appuyez sur **Ctrl+C**

2. **Relancez le serveur** :
   ```bash
   npm run dev
   ```

3. **Attendez** de voir :
   ```
   ✓ Ready
   - Local:        http://localhost:3000
   ```

4. **Rafraîchissez** votre navigateur (F5)

**✅ L'erreur "Failed to fetch" devrait disparaître !**

---

## 🔍 Vérification

### Test Rapide

1. Ouvrez : http://localhost:3000
2. Essayez de vous connecter ou créer un compte
3. Si ça fonctionne → ✅ Problème résolu !
4. Si l'erreur persiste → Vérifiez ci-dessous

---

## 🐛 Si Ça Ne Fonctionne Toujours Pas

### Vérification 1 : Le Fichier Est Correct

Ouvrez `.env.local` et vérifiez :

- [ ] `NEXT_PUBLIC_SUPABASE_URL` commence par `https://` et finit par `.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` commence par `eyJ` et est très long
- [ ] `SUPABASE_SERVICE_ROLE_KEY` commence par `eyJ` et est très long
- [ ] Pas de guillemets autour des valeurs
- [ ] Pas d'espaces avant/après le `=`

### Vérification 2 : Le Serveur a Redémarré

- [ ] Vous avez bien arrêté le serveur (Ctrl+C)
- [ ] Vous avez bien relancé (`npm run dev`)
- [ ] Le serveur affiche "✓ Ready"

### Vérification 3 : Les Clés Sont Correctes

1. Allez sur votre dashboard Supabase
2. Vérifiez que votre projet est **actif** (pas en pause)
3. Vérifiez que vous avez bien copié les clés **en entier**
4. Testez l'URL dans votre navigateur : `https://votre-projet.supabase.co`
   - Si ça charge → L'URL est correcte
   - Si erreur 404 → L'URL est incorrecte

### Vérification 4 : Connexion Internet

- [ ] Votre connexion internet fonctionne
- [ ] Pas de firewall qui bloque Supabase
- [ ] Pas de VPN qui interfère

---

## 📋 Checklist Complète

- [ ] Projet Supabase créé (ou existant)
- [ ] Clés Supabase récupérées (URL, anon key, service_role key)
- [ ] Fichier `.env.local` ouvert
- [ ] Valeurs remplacées par les vraies clés
- [ ] Fichier sauvegardé
- [ ] Serveur arrêté (Ctrl+C)
- [ ] Serveur relancé (`npm run dev`)
- [ ] Navigateur rafraîchi (F5)
- [ ] Test de connexion effectué

---

## 🎯 Exemple Complet

Voici à quoi devrait ressembler votre `.env.local` (avec de vraies valeurs) :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.ExempleDeCleTresLonguePourTest
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.AutreExempleDeCleTresLonguePourTest

# Google Gemini AI (GRATUIT) - Optionnel pour l'instant
GOOGLE_GEMINI_API_KEY=votre-clé-gemini-ici
```

---

## 🆘 Besoin d'Aide ?

Si après avoir suivi ces étapes l'erreur persiste :

1. **Vérifiez les logs serveur** (terminal) pour voir les erreurs exactes
2. **Vérifiez la console navigateur** (F12) pour voir les erreurs réseau
3. **Vérifiez que votre projet Supabase est actif** (pas en pause)

---

**Une fois que vous avez rempli `.env.local` avec vos vraies clés Supabase et redémarré le serveur, l'erreur "Failed to fetch" devrait disparaître ! 🎉**
