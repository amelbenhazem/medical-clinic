-- ============================================
-- SCHÉMA COMPLET POUR SYSTÈME DE GESTION DE CLINIQUE
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- https://supabase.com/dashboard/project/nybpuiqopfroyjgjfomd/editor

-- ============================================
-- 1. TABLE PROFILES (Utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABLE CLINICS (Cliniques)
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TABLE CLINIC_STAFF (Personnel Clinique)
-- ============================================
CREATE TABLE IF NOT EXISTS clinic_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, user_id)
);

-- ============================================
-- 4. TABLE PATIENTS (Patients)
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TABLE SERVICES (Services Clinique)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. TABLE APPOINTMENTS (Rendez-vous)
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. TABLE CONSULTATIONS (Consultations)
-- ============================================
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symptoms TEXT,
  diagnosis TEXT,
  examination_notes TEXT,
  treatment_plan TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. TABLE PRESCRIPTIONS (Prescriptions)
-- ============================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medications JSONB NOT NULL,
  instructions TEXT,
  pdf_url TEXT,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. TABLE MEDICAL_HISTORY (Historique Médical)
-- ============================================
CREATE TABLE IF NOT EXISTS medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  allergies TEXT[],
  chronic_conditions TEXT[],
  past_surgeries TEXT[],
  blood_type TEXT,
  family_history TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. TABLE NOTIFICATIONS (Notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 11. TABLE DOCTOR_AVAILABILITY (Disponibilités)
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week)
);

-- ============================================
-- 12. ROW LEVEL SECURITY (RLS) - PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinic_staff
      WHERE clinic_staff.user_id = auth.uid()
      AND clinic_staff.role = 'admin'
    )
  );

-- ============================================
-- 13. ROW LEVEL SECURITY - CLINICS
-- ============================================
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Les propriétaires peuvent voir leurs cliniques
CREATE POLICY "Owners can view own clinics"
  ON clinics FOR SELECT
  USING (owner_id = auth.uid());

-- Les propriétaires peuvent modifier leurs cliniques
CREATE POLICY "Owners can update own clinics"
  ON clinics FOR UPDATE
  USING (owner_id = auth.uid());

-- Les propriétaires peuvent créer des cliniques
CREATE POLICY "Owners can insert own clinics"
  ON clinics FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Le staff peut voir les cliniques où ils travaillent
CREATE POLICY "Staff can view clinic"
  ON clinics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinic_staff
      WHERE clinic_staff.clinic_id = clinics.id
      AND clinic_staff.user_id = auth.uid()
    )
  );

-- ============================================
-- 14. ROW LEVEL SECURITY - PATIENTS
-- ============================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Les patients peuvent voir leur propre profil
CREATE POLICY "Patients can view own profile"
  ON patients FOR SELECT
  USING (profile_id = auth.uid());

-- Le staff peut voir les patients de leur clinique
CREATE POLICY "Staff can view clinic patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinic_staff
      WHERE clinic_staff.clinic_id = patients.clinic_id
      AND clinic_staff.user_id = auth.uid()
    )
  );

-- Le staff peut créer des patients
CREATE POLICY "Staff can insert patients"
  ON patients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_staff
      WHERE clinic_staff.clinic_id = patients.clinic_id
      AND clinic_staff.user_id = auth.uid()
    )
  );

-- Le staff peut modifier les patients
CREATE POLICY "Staff can update patients"
  ON patients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clinic_staff
      WHERE clinic_staff.clinic_id = patients.clinic_id
      AND clinic_staff.user_id = auth.uid()
    )
  );

-- ============================================
-- 15. ROW LEVEL SECURITY - APPOINTMENTS
-- ============================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Les patients peuvent voir leurs rendez-vous
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = appointments.patient_id
      AND patients.profile_id = auth.uid()
    )
  );

-- Le staff peut voir les rendez-vous de leur clinique
CREATE POLICY "Staff can view clinic appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinic_staff
      WHERE clinic_staff.clinic_id = appointments.clinic_id
      AND clinic_staff.user_id = auth.uid()
    )
  );

-- Le staff peut créer des rendez-vous
CREATE POLICY "Staff can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_staff
      WHERE clinic_staff.clinic_id = appointments.clinic_id
      AND clinic_staff.user_id = auth.uid()
    )
  );

-- Les patients peuvent créer leurs propres rendez-vous
CREATE POLICY "Patients can insert own appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = appointments.patient_id
      AND patients.profile_id = auth.uid()
    )
  );

-- ============================================
-- 16. ROW LEVEL SECURITY - CONSULTATIONS
-- ============================================
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Les patients peuvent voir leurs consultations
CREATE POLICY "Patients can view own consultations"
  ON consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = consultations.patient_id
      AND patients.profile_id = auth.uid()
    )
  );

-- Les médecins peuvent voir leurs consultations
CREATE POLICY "Doctors can view own consultations"
  ON consultations FOR SELECT
  USING (doctor_id = auth.uid());

-- Les médecins peuvent créer des consultations
CREATE POLICY "Doctors can insert consultations"
  ON consultations FOR INSERT
  WITH CHECK (doctor_id = auth.uid());

-- ============================================
-- 17. ROW LEVEL SECURITY - NOTIFICATIONS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent mettre à jour leurs notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- 18. FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour obtenir le rôle dans une clinique
CREATE OR REPLACE FUNCTION get_clinic_role(clinic_uuid UUID, user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM clinic_staff
  WHERE clinic_id = clinic_uuid AND user_id = user_uuid
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Fonction pour vérifier si admin
CREATE OR REPLACE FUNCTION is_clinic_admin(clinic_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clinic_staff
    WHERE clinic_id = clinic_uuid
    AND user_id = user_uuid
    AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Fonction pour vérifier si membre du staff
CREATE OR REPLACE FUNCTION is_clinic_staff(clinic_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clinic_staff
    WHERE clinic_id = clinic_uuid
    AND user_id = user_uuid
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- 19. TRIGGERS POUR UPDATED_AT
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 20. INDEXES POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_clinic_staff_clinic_user ON clinic_staff(clinic_id, user_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_profile ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_id);

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
-- Vérifiez que toutes les tables sont créées :
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' ORDER BY table_name;
