# 🚀 COMMENT LANCER LE PROJET - Guide Simple

## ⚡ DÉMARRAGE RAPIDE (5 minutes)

### 1️⃣ Ouvrir le Terminal

- Appuyez sur **Windows + R**
- Tapez : `powershell`
- Appuyez sur **Entrée**

### 2️⃣ Aller dans le Projet

Dans PowerShell, tapez :

```powershell
cd "C:\Users\DELL\Desktop\projet dev\projet-react-fac"
```

Appuyez sur **Entrée**

### 3️⃣ Créer le Fichier de Configuration

**Créez un fichier `.env.local` dans le dossier du projet :**

**Option A - Avec Notepad :**
1. Dans PowerShell, tapez : `notepad .env.local`
2. Collez ce contenu :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role
GOOGLE_GEMINI_API_KEY=votre-clé-gemini
```

3. Remplacez les valeurs par vos vraies clés
4. Sauvegardez (Ctrl+S) et fermez

**Option B - Avec VS Code :**
1. Ouvrez VS Code dans le dossier du projet
2. Créez un nouveau fichier `.env.local`
3. Collez le contenu ci-dessus
4. Remplacez les valeurs

### 4️⃣ Obtenir la Clé API Gemini (GRATUIT)

1. Allez sur : **https://makersuite.google.com/app/apikey**
2. Connectez-vous avec Google
3. Cliquez sur **"Create API Key"**
4. Copiez la clé
5. Collez-la dans `.env.local` à la place de `votre-clé-gemini`

### 5️⃣ Lancer le Projet

Dans PowerShell, tapez :

```powershell
npm run dev
```

**Attendez de voir :**
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
✓ Ready
```

### 6️⃣ Ouvrir dans le Navigateur

1. Ouvrez Chrome/Firefox/Edge
2. Allez sur : **http://localhost:3000**
3. Créez un compte ou connectez-vous

---

## 🧪 TESTER L'IA (2 minutes)

### Test Rapide dans la Console

1. **Ouvrez la console** : Appuyez sur **F12**
2. Allez dans l'onglet **Console**
3. **Collez ce code** :

```javascript
fetch('/api/ai/optimize-appointments/detect-urgency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ notes: 'Douleur thoracique' })
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    alert('✅ IA FONCTIONNE ! Urgence: ' + data.level)
  } else {
    alert('❌ Erreur: ' + data.error)
  }
})
```

4. Appuyez sur **Entrée**

**Si vous voyez "✅ IA FONCTIONNE !" → Ça marche ! 🎉**

---

## 📋 RÉSUMÉ DES COMMANDES

```powershell
# 1. Aller dans le projet
cd "C:\Users\DELL\Desktop\projet dev\projet-react-fac"

# 2. Lancer le serveur
npm run dev

# 3. Ouvrir dans le navigateur
# http://localhost:3000
```

---

## ❌ PROBLÈMES COURANTS

### "npm n'est pas reconnu"
→ Installez Node.js : https://nodejs.org/

### "Port 3000 déjà utilisé"
→ Arrêtez l'autre application ou changez le port

### "GOOGLE_GEMINI_API_KEY is not defined"
→ Créez `.env.local` avec la clé API

### "Unauthorized"
→ Connectez-vous à l'application d'abord

---

## 🎯 C'EST TOUT !

**Suivez ces 6 étapes et vous pourrez tester l'IA !**

Pour plus de détails, consultez `GUIDE_COMPLET_DEMARRAGE.md`
