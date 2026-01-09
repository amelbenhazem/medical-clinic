# 🚀 Guide de Démarrage - Système de Gestion de Clinique

Ce guide vous explique comment installer et exécuter le projet localement.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure) - [Télécharger](https://nodejs.org/)
- **npm** ou **yarn** ou **pnpm** (gestionnaire de paquets)
- **Git** - [Télécharger](https://git-scm.com/)
- **Compte Supabase** (gratuit) - [Créer un compte](https://supabase.com/)

### Vérification des prérequis

```bash
# Vérifier Node.js
node --version
# Doit afficher v18.x.x ou supérieur

# Vérifier npm
npm --version

# Vérifier Git
git --version
```

---

## 🔧 Installation

### Étape 1 : Cloner le projet (si nécessaire)

Si vous n'avez pas encore le projet :

```bash
git clone <url-du-repo>
cd projet-react-fac
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

Cela installera toutes les dépendances listées dans `package.json`.

**Temps estimé :** 2-5 minutes

---

## 🔐 Configuration Supabase

### Étape 1 : Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte (gratuit) ou connectez-vous
3. Cliquez sur **"New Project"**
4. Remplissez les informations :
   - **Name** : `medical-clinic` (ou votre choix)
   - **Database Password** : Choisissez un mot de passe fort
   - **Region** : Choisissez la région la plus proche
5. Cliquez sur **"Create new project"**

**⏱️ Attendez 2-3 minutes** que le projet soit créé.

### Étape 2 : Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** → **API**
2. Vous verrez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ Secret!)

### Étape 3 : Configurer la base de données

Le projet utilise une base de données PostgreSQL via Supabase. Vous devez créer les tables nécessaires.

#### Option A : Utiliser SQL Editor dans Supabase

1. Dans Supabase, allez dans **SQL Editor**
2. Créez un nouveau fichier SQL
3. Exécutez le schéma de base de données (voir section suivante)

#### Option B : Utiliser les migrations (si disponibles)

```bash
# Si vous avez des fichiers de migration
supabase db push
```

### Schéma de base de données

Le schéma complet est défini dans `types/database.types.ts`. Vous devrez créer les tables suivantes dans Supabase :

- `profiles`
- `clinics`
- `clinic_staff`
- `patients`
- `appointments`
- `consultations`
- `prescriptions`
- `medical_history`
- `services`
- `notifications`

**💡 Astuce :** Vous pouvez utiliser le SQL Editor de Supabase pour créer ces tables, ou demander le script SQL complet.

---

## ⚙️ Configuration des Variables d'Environnement

### Étape 1 : Créer le fichier `.env.local`

À la racine du projet, créez un fichier `.env.local` :

```bash
# Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# Linux/Mac
touch .env.local
```

### Étape 2 : Ajouter les variables

Ouvrez `.env.local` et ajoutez :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-publique
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role

# Optionnel : Configuration de développement
NODE_ENV=development
```

**⚠️ Important :**
- Remplacez `votre-projet.supabase.co` par votre Project URL
- Remplacez `votre-clé-anon-publique` par votre anon public key
- Remplacez `votre-clé-service-role` par votre service_role key
- **Ne commitez JAMAIS** ce fichier dans Git (il est déjà dans `.gitignore`)

### Exemple de fichier `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://aaefkcgyqmwsfzwkjxkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZrY2d5cW13c2Z6d2tqeGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA3NzQsImV4cCI6MjA3ODUxNjc3NH0.weMQQdTHTB-zTnYxaFqW-k8lsy9onXQLLst6qcMqtcc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZrY2d5cW13c2Z6d2tqeGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0MDc3NCwiZXhwIjoyMDc4NTE2Nzc0fQ.3nUnuDSDsqhVGRWX7GPsROhOxH3JQQex-LZTqZrgvEo
```

---

## 🏃 Exécution du Projet

### Mode Développement (Recommandé)

```bash
npm run dev
```

Le serveur de développement démarre sur **http://localhost:3000**

Ouvrez votre navigateur et allez sur : **http://localhost:3000**

**✅ Vous devriez voir :**
- La page d'accueil qui redirige vers `/login` si vous n'êtes pas connecté
- La page de connexion si vous n'avez pas de compte

### Commandes Disponibles

```bash
# Développement (avec hot-reload)
npm run dev

# Build pour production
npm run build

# Démarrer en mode production
npm run start

# Linter (vérification du code)
npm run lint
```

---

## 👤 Créer le Premier Utilisateur

### Étape 1 : S'inscrire

1. Allez sur **http://localhost:3000/register**
2. Remplissez le formulaire :
   - Email
   - Mot de passe
   - Nom complet
   - Téléphone
   - Rôle (admin, doctor, receptionist, patient)
3. Cliquez sur **"S'inscrire"**

### Étape 2 : Se connecter

1. Allez sur **http://localhost:3000/login**
2. Entrez votre email et mot de passe
3. Cliquez sur **"Se connecter"**

### Étape 3 : Créer une clinique (si Admin)

Si vous êtes connecté en tant qu'**admin** :

1. Vous serez redirigé vers `/admin`
2. Créez votre première clinique
3. Configurez les services et le personnel

---

## 🐳 Alternative : Exécution avec Docker

Si vous préférez utiliser Docker :

### Prérequis Docker

- **Docker Desktop** installé - [Télécharger](https://www.docker.com/products/docker-desktop)

### Étape 1 : Créer le fichier `.env`

```bash
# Copier les variables d'environnement
cp .env.local .env
```

### Étape 2 : Lancer avec Docker Compose

```bash
# Construire et démarrer les conteneurs
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les conteneurs
docker-compose down
```

L'application sera disponible sur **http://localhost**

---

## 🔍 Vérification que Tout Fonctionne

### Checklist

- [ ] Le serveur démarre sans erreur
- [ ] La page http://localhost:3000 s'affiche
- [ ] Vous pouvez vous inscrire
- [ ] Vous pouvez vous connecter
- [ ] Vous êtes redirigé vers le dashboard selon votre rôle
- [ ] Les données sont sauvegardées dans Supabase

### Problèmes Courants

#### ❌ Erreur : "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solution :** Vérifiez que votre fichier `.env.local` existe et contient les bonnes variables.

#### ❌ Erreur : "Invalid API key"

**Solution :** Vérifiez que vous avez copié les bonnes clés depuis Supabase.

#### ❌ Erreur : "Cannot connect to Supabase"

**Solution :** 
- Vérifiez votre connexion internet
- Vérifiez que votre projet Supabase est actif
- Vérifiez l'URL dans `.env.local`

#### ❌ Erreur : "Module not found"

**Solution :** 
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

#### ❌ Port 3000 déjà utilisé

**Solution :** 
```bash
# Utiliser un autre port
npm run dev -- -p 3001
```

---

## 📱 Structure des URLs

Une fois connecté, vous serez redirigé selon votre rôle :

- **Admin** : `/admin`
- **Doctor** : `/doctor`
- **Receptionist** : `/receptionist`
- **Patient** : `/patient`

### Pages Publiques

- `/` - Page d'accueil (redirection)
- `/login` - Connexion
- `/register` - Inscription

### Pages Protégées

- `/admin/*` - Interface administrateur
- `/doctor/*` - Interface médecin
- `/receptionist/*` - Interface réceptionniste
- `/patient/*` - Interface patient

---

## 🛠️ Développement

### Structure des Fichiers Importants

```
projet-react-fac/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Routes d'authentification
│   ├── (dashboard)/       # Routes protégées
│   └── api/               # API Routes
├── components/            # Composants React
├── lib/                   # Utilitaires et clients
├── hooks/                 # React Hooks personnalisés
└── types/                 # Types TypeScript
```

### Hot Reload

Le serveur de développement recharge automatiquement les changements :
- Modifications dans `app/` → Rechargement automatique
- Modifications dans `components/` → Rechargement automatique
- Modifications dans `lib/` → Rechargement automatique

### Debugging

```bash
# Voir les logs du serveur
# Les logs apparaissent dans le terminal où vous avez lancé `npm run dev`

# Voir les erreurs dans le navigateur
# Ouvrez la console du navigateur (F12)
```

---

## 📚 Ressources Utiles

- **Documentation Next.js** : https://nextjs.org/docs
- **Documentation Supabase** : https://supabase.com/docs
- **Documentation React** : https://react.dev
- **Documentation TypeScript** : https://www.typescriptlang.org/docs

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les **Problèmes Courants** ci-dessus
2. Consultez les logs dans le terminal
3. Vérifiez la console du navigateur (F12)
4. Vérifiez que Supabase est bien configuré

---

## ✅ Prochaines Étapes

Une fois le projet lancé :

1. ✅ Créez votre premier compte admin
2. ✅ Créez une clinique
3. ✅ Ajoutez des services
4. ✅ Invitez du personnel
5. ✅ Testez les fonctionnalités

**Bon développement ! 🚀**
