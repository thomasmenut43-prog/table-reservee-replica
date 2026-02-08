-- =============================================
-- SETUP COMPLET - Table Profiles + RLS + Sync
-- Exécute ce script une seule fois dans Supabase SQL Editor
-- =============================================

-- 1. SUPPRIMER la table si elle existe (pour recommencer proprement)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CRÉER la table profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'restaurateur' CHECK (role IN ('admin', 'restaurateur', 'customer')),
  restaurant_id TEXT,
  subscription_status TEXT,
  subscription_end_date TIMESTAMPTZ,
  is_disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACTIVER RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. POLITIQUES RLS
-- Lecture: tous les utilisateurs authentifiés peuvent voir les profils
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Mise à jour: utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Mise à jour: admins peuvent modifier tous les profils
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insertion: permettre au trigger de créer des profils
CREATE POLICY "Enable insert for auth trigger" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 5. TRIGGER pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'thomas.menut43@gmail.com' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'restaurateur')
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SYNCHRONISER les utilisateurs existants
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  CASE 
    WHEN email = 'thomas.menut43@gmail.com' THEN 'admin'
    ELSE COALESCE(raw_user_meta_data->>'role', 'restaurateur')
  END,
  NOW(),
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET 
  role = CASE 
    WHEN EXCLUDED.email = 'thomas.menut43@gmail.com' THEN 'admin'
    ELSE profiles.role
  END;

-- 7. VÉRIFIER les résultats
SELECT * FROM public.profiles ORDER BY created_at DESC;
