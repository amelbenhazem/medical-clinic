# 🔧 FIX - Erreur Supabase "URL and Key are required"

## ❌ Erreur Actuelle

```
Your project's URL and Key are required to create a Supabase client!
```

**Cause :** Le fichier `.env.local` n'existe pas ou n'a pas les bonnes variables.

---

## ✅ SOLUTION RAPIDE

### Étape 1 : Le Fichier .env.local a été Créé

Le fichier `.env.local` a été créé automatiquement avec un template.

### Étape 2 : Remplir avec vos Vraies Clés Supabase

**Ouvrez le fichier `.env.local`** et remplacez les valeurs :

#### A. Obtenir les Clés Supabase

1. Allez sur : **https://supabase.com/dashboard**
2. Connectez-vous
3. Sélectionnez votre projet (ou créez-en un)
4. Allez dans : **Settings** → **API**
5. Vous verrez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (commence par `eyJ...`)
   - **service_role** key (commence par `eyJ...` - ⚠️ SECRET!)

#### B. Mettre à Jour .env.local

Ouvrez `.env.local` et remplacez :

```env
# Remplacez ces valeurs par vos vraies clés Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optionnel pour l'IA (peut être ajouté plus tard)
GOOGLE_GEMINI_API_KEY=votre-clé-gemini-ici
```

**⚠️ Important :**
- Remplacez `https://xxxxx.supabase.co` par votre vraie URL
- Remplacez les clés `eyJ...` par vos vraies clés
- Ne mettez PAS d'espaces autour du `=`
- Ne mettez PAS de guillemets autour des valeurs

### Étape 3 : Redémarrer le Serveur

**Arrêtez le serveur** (Ctrl+C dans le terminal) puis :

```bash
npm run dev
```

**✅ L'erreur devrait disparaître !**

---

## 🎯 Exemple de .env.local Correct

```env
NEXT_PUBLIC_SUPABASE_URL=https://aaefkcgyqmwsfzwkjxkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZrY2d5cW13c2Z6d2tqeGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA3NzQsImV4cCI6MjA3ODUxNjc3NH0.weMQQdTHTB-zTnYxaFqW-k8lsy9onXQLLst6qcMqtcc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZrY2d5cW13c2Z6d2tqeGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0MDc3NCwiZXhwIjoyMDc4NTE2Nzc0fQ.3nUnuDSDsqhVGRWX7GPsROhOxH3JQQex-LZTqZrgvEo
GOOGLE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🔍 Vérification

### Vérifier que le Fichier Existe

```powershell
# Dans PowerShell
cd "C:\Users\DELL\Desktop\projet dev\projet-react-fac"
Get-Content .env.local
```

Vous devriez voir vos clés (sans les valeurs sensibles affichées).

### Vérifier que le Serveur Lit les Variables

1. Redémarrez le serveur : `npm run dev`
2. Si l'erreur persiste :
   - Vérifiez que `.env.local` est bien à la racine du projet
   - Vérifiez qu'il n'y a pas d'espaces dans les valeurs
   - Vérifiez que les clés sont complètes

---

## 🆘 Si Ça Ne Fonctionne Pas

### Erreur Persiste Après Configuration

1. **Vérifiez le nom du fichier** : Il doit s'appeler exactement `.env.local` (avec le point au début)
2. **Vérifiez l'emplacement** : Il doit être à la racine du projet (même niveau que `package.json`)
3. **Redémarrez complètement** :
   - Arrêtez le serveur (Ctrl+C)
   - Attendez 2 secondes
   - Relancez : `npm run dev`

### Vous N'avez Pas de Projet Supabase

1. Allez sur : **https://supabase.com**
2. Créez un compte (gratuit)
3. Créez un nouveau projet
4. Attendez 2-3 minutes que le projet soit créé
5. Récupérez les clés dans Settings → API

---

## ✅ Checklist

- [ ] Fichier `.env.local` créé
- [ ] `NEXT_PUBLIC_SUPABASE_URL` rempli avec votre URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` rempli avec votre clé anon
- [ ] `SUPABASE_SERVICE_ROLE_KEY` rempli avec votre clé service_role
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Erreur disparue

---

**Une fois que vous avez rempli `.env.local` avec vos vraies clés Supabase et redémarré le serveur, l'erreur devrait disparaître ! 🎉**
