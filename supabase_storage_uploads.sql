-- ============================================================
-- Bucket Supabase Storage pour les uploads (remplacement Base44)
-- Exécuter dans Supabase > SQL Editor > Run
-- ============================================================
-- Crée le bucket "uploads" (public) et les politiques RLS pour
-- que les utilisateurs connectés puissent uploader et tout le
-- monde puisse voir les images (logos, couvertures, etc.).

-- 1. Créer le bucket (public = URLs accessibles sans auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Politique : tout le monde peut lire (bucket public)
DROP POLICY IF EXISTS "Public read uploads" ON storage.objects;
CREATE POLICY "Public read uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- 3. Politique : les utilisateurs authentifiés peuvent uploader
DROP POLICY IF EXISTS "Authenticated can upload" ON storage.objects;
CREATE POLICY "Authenticated can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- 4. Politique : les utilisateurs authentifiés peuvent mettre à jour (optionnel)
DROP POLICY IF EXISTS "Authenticated can update uploads" ON storage.objects;
CREATE POLICY "Authenticated can update uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads');

-- 5. Politique : les utilisateurs authentifiés peuvent supprimer (optionnel)
DROP POLICY IF EXISTS "Authenticated can delete uploads" ON storage.objects;
CREATE POLICY "Authenticated can delete uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');
