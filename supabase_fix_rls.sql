-- =============================================
-- FIX RLS POLICIES - Permettre aux admins de modifier les profils
-- =============================================

-- Ajouter politique UPDATE pour les admins
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'profiles';
