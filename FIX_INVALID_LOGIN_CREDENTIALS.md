# 🔧 FIX - Erreur "Invalid login credentials"

## ❌ Problème

```
Invalid login credentials
```

**Causes possibles :**
1. Le compte n'existe pas encore → Vous devez créer un compte d'abord
2. Email ou mot de passe incorrect → Vérifiez vos identifiants
3. Problème de configuration Supabase → Vérifiez les clés API

---

## ✅ SOLUTION - Créer un Compte

### Étape 1 : Aller sur la Page d'Inscription

1. Ouvrez : **http://localhost:3000**
2. Cliquez sur **"Sign up"** ou **"S'inscrire"**
3. Ou allez directement sur : **http://localhost:3000/register**

### Étape 2 : Remplir le Formulaire

Remplissez tous les champs :

- **Full Name** : Votre nom complet (ex: `John Doe`)
- **Email** : Votre email (ex: `john@example.com`)
- **Phone** : Votre téléphone (ex: `+1234567890` ou `0123456789`)
- **Password** : Votre mot de passe (minimum 6 caractères)
- **Confirm Password** : Retapez le même mot de passe

### Étape 3 : Créer le Compte

1. Cliquez sur **"Create account"**
2. Attendez quelques secondes
3. Vous devriez être redirigé automatiquement

**✅ Si ça fonctionne :** Vous êtes connecté et redirigé vers le dashboard !

---

## 🐛 Si la Création de Compte Échoue

### Erreur : "Failed to create profile"

**Cause :** La table `profiles` n'existe pas dans Supabase

**Solution :** Créez la table `profiles` dans Supabase :

1. Allez sur : **https://supabase.com/dashboard/project/nybpuiqopfroyjgjfomd/editor**
2. Cliquez sur **"SQL Editor"**
3. Créez un nouveau fichier SQL
4. Exécutez ce script :

```sql
-- Créer la table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Politique : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Politique : Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

5. Cliquez sur **"Run"** ou **"Exécuter"**

### Erreur : "Email already registered"

**Solution :** Utilisez un autre email ou connectez-vous avec cet email

### Erreur : "Password too short"

**Solution :** Utilisez un mot de passe d'au moins 6 caractères

---

## 🔍 Vérification

### Après Création du Compte

1. Vous devriez être **automatiquement connecté**
2. Vous devriez être **redirigé** vers `/patient` (si rôle patient)
3. Vous devriez voir votre **dashboard**

### Si Vous Êtes Redirigé vers `/login`

**Cause :** Problème de configuration Supabase ou table `profiles` manquante

**Solution :**
1. Vérifiez que la table `profiles` existe dans Supabase
2. Vérifiez que les clés API sont correctes dans `.env.local`
3. Redémarrez le serveur

---

## 📋 Checklist

- [ ] Allé sur `/register`
- [ ] Rempli tous les champs du formulaire
- [ ] Cliqué sur "Create account"
- [ ] Compte créé avec succès
- [ ] Redirigé vers le dashboard
- [ ] Si erreur → Vérifié la table `profiles` dans Supabase

---

## 🎯 Prochaines Étapes Après Connexion

Une fois connecté :

1. **Si vous êtes Admin :**
   - Créez une clinique
   - Ajoutez du personnel
   - Configurez les services

2. **Si vous êtes Patient :**
   - Prenez un rendez-vous
   - Consultez vos dossiers médicaux

3. **Testez l'IA :**
   - Créez un rendez-vous
   - Ajoutez des notes (ex: "Douleur thoracique")
   - Cliquez sur "Obtenir Suggestions IA"

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

1. **Vérifiez les logs serveur** (terminal) pour voir les erreurs exactes
2. **Vérifiez la console navigateur** (F12) pour les erreurs
3. **Vérifiez que Supabase est bien configuré** :
   - URL correcte dans `.env.local`
   - Clés API correctes
   - Tables créées dans Supabase

---

**Créez d'abord un compte via `/register`, puis vous pourrez vous connecter ! 🚀**
