# 🗄️ Guide - Créer les Tables dans Supabase

## ❌ Erreur Actuelle

```
Failed to create profile. Please try again.
```

**Cause :** La table `profiles` (et probablement d'autres tables) n'existe pas dans votre base de données Supabase.

---

## ✅ SOLUTION - Créer Toutes les Tables

### Étape 1 : Ouvrir SQL Editor dans Supabase

1. Allez sur : **https://supabase.com/dashboard/project/nybpuiqopfroyjgjfomd/editor**
2. Cliquez sur **"SQL Editor"** dans le menu de gauche
3. Cliquez sur **"New query"** ou **"Nouvelle requête"**

### Étape 2 : Copier le Script SQL

1. Ouvrez le fichier **`SCHEMA_SUPABASE_COMPLET.sql`** dans votre projet
2. **Copiez TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. **Collez-le** dans l'éditeur SQL de Supabase

### Étape 3 : Exécuter le Script

1. Cliquez sur **"Run"** ou **"Exécuter"** (ou appuyez sur Ctrl+Enter)
2. **⏱️ Attendez 10-30 secondes** que le script s'exécute
3. Vous devriez voir : **"Success. No rows returned"** ou un message de succès

**✅ Toutes les tables sont maintenant créées !**

---

## 🔍 Vérification

### Vérifier que les Tables sont Créées

Dans SQL Editor, exécutez :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Vous devriez voir :**
- appointments
- clinic_staff
- clinics
- consultations
- doctor_availability
- medical_history
- notifications
- patients
- prescriptions
- profiles
- services

**✅ Si vous voyez toutes ces tables → C'est bon !**

---

## 🧪 Tester la Création de Compte

1. **Redémarrez votre serveur** (si nécessaire) :
   ```bash
   npm run dev
   ```

2. **Allez sur** : http://localhost:3000/register

3. **Remplissez le formulaire** :
   - Full Name : `Test User`
   - Email : `test@example.com`
   - Phone : `0123456789`
   - Password : `test123`
   - Confirm Password : `test123`

4. **Cliquez sur "Create account"**

**✅ Si ça fonctionne :** Vous êtes connecté et redirigé vers le dashboard !

---

## 🐛 Si le Script Échoue

### Erreur : "relation already exists"

**Solution :** C'est normal, certaines tables existent déjà. Le script utilise `CREATE TABLE IF NOT EXISTS` donc ça ne devrait pas poser de problème.

### Erreur : "permission denied"

**Solution :** 
1. Vérifiez que vous êtes connecté à Supabase
2. Vérifiez que vous avez les droits sur le projet
3. Essayez d'exécuter le script section par section

### Erreur : "syntax error"

**Solution :**
1. Vérifiez que vous avez copié TOUT le script
2. Vérifiez qu'il n'y a pas d'erreurs de copier-coller
3. Essayez d'exécuter section par section

---

## 📋 Checklist

- [ ] SQL Editor ouvert dans Supabase
- [ ] Script `SCHEMA_SUPABASE_COMPLET.sql` copié
- [ ] Script collé dans SQL Editor
- [ ] Script exécuté avec succès
- [ ] Tables vérifiées (12 tables au total)
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Test de création de compte effectué
- [ ] Compte créé avec succès

---

## 🎯 Prochaines Étapes

Une fois les tables créées :

1. **Créez un compte** via `/register`
2. **Connectez-vous**
3. **Si vous êtes admin** : Créez une clinique
4. **Testez l'IA** : Créez un rendez-vous avec des notes

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

1. **Vérifiez les logs serveur** (terminal) pour voir l'erreur exacte
2. **Vérifiez la console navigateur** (F12) pour les erreurs
3. **Vérifiez dans Supabase** que les tables existent bien
4. **Vérifiez les permissions RLS** (Row Level Security)

---

**Exécutez le script SQL dans Supabase et vous pourrez créer des comptes ! 🚀**
