# 📋 Instructions - Créer Toutes les Tables dans Supabase

## 🎯 Objectif

Créer toutes les tables nécessaires pour le système de gestion de clinique dans Supabase.

---

## ✅ ÉTAPE PAR ÉTAPE

### Étape 1 : Ouvrir SQL Editor

1. Allez sur : **https://supabase.com/dashboard/project/nybpuiqopfroyjgjfomd/editor**
2. Cliquez sur **"SQL Editor"** dans le menu de gauche
3. Cliquez sur **"New query"** ou **"Nouvelle requête"**

### Étape 2 : Copier le Script SQL

1. Ouvrez le fichier **`TABLES_SQL_COMPLET.sql`** dans votre projet
2. **Sélectionnez TOUT** (Ctrl+A)
3. **Copiez** (Ctrl+C)

### Étape 3 : Coller et Exécuter

1. **Collez** le script dans SQL Editor de Supabase (Ctrl+V)
2. Cliquez sur **"Run"** ou appuyez sur **Ctrl+Enter**
3. **⏱️ Attendez 10-30 secondes** que le script s'exécute

**✅ Vous devriez voir : "Success. No rows returned"**

---

## 📊 Tables Créées (11 tables)

Le script crée les tables suivantes :

1. ✅ **profiles** - Profils utilisateurs
2. ✅ **clinics** - Cliniques
3. ✅ **clinic_staff** - Personnel clinique
4. ✅ **patients** - Patients
5. ✅ **services** - Services clinique
6. ✅ **appointments** - Rendez-vous
7. ✅ **consultations** - Consultations médicales
8. ✅ **prescriptions** - Prescriptions
9. ✅ **medical_history** - Historique médical
10. ✅ **notifications** - Notifications
11. ✅ **doctor_availability** - Disponibilités médecins

**+ Sécurité (RLS), Fonctions, Triggers, Indexes**

---

## 🔍 Vérification

### Vérifier que les Tables sont Créées

Dans SQL Editor, exécutez cette requête :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Vous devriez voir 11 tables listées.**

---

## 🧪 Test Après Création

1. **Redémarrez votre serveur** (si nécessaire) :
   ```bash
   npm run dev
   ```

2. **Allez sur** : http://localhost:3000/register

3. **Créez un compte** :
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

**Solution :** C'est normal si certaines tables existent déjà. Le script utilise `CREATE TABLE IF NOT EXISTS` donc ça ne devrait pas poser de problème.

### Erreur : "permission denied"

**Solution :** 
1. Vérifiez que vous êtes bien connecté à Supabase
2. Vérifiez que vous avez les droits sur le projet
3. Essayez d'exécuter le script section par section

### Erreur : "syntax error"

**Solution :**
1. Vérifiez que vous avez copié TOUT le script
2. Vérifiez qu'il n'y a pas d'erreurs de copier-coller
3. Essayez d'exécuter section par section

---

## 📝 Résumé

1. ✅ Ouvrir SQL Editor dans Supabase
2. ✅ Copier le contenu de `TABLES_SQL_COMPLET.sql`
3. ✅ Coller dans SQL Editor
4. ✅ Exécuter (Run)
5. ✅ Vérifier les tables créées
6. ✅ Tester la création de compte

---

**Une fois les tables créées, vous pourrez créer des comptes et utiliser l'application ! 🚀**
