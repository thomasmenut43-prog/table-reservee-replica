-- =============================================
-- STORAGE POLICIES (UPDATED)
-- Exécute ce script dans Supabase SQL Editor
-- =============================================

-- 1. Policies for 'image-restaurant' bucket
DROP POLICY IF EXISTS "Public Access Get" ON storage.objects;
CREATE POLICY "Public Access Get" ON storage.objects FOR SELECT USING (bucket_id = 'image-restaurant');

DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'image-restaurant' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'image-restaurant' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'image-restaurant' AND auth.role() = 'authenticated'
);

-- 2. Policies for 'logo-restaurant' bucket
DROP POLICY IF EXISTS "Public Read Logo" ON storage.objects;
CREATE POLICY "Public Read Logo" ON storage.objects FOR SELECT USING (bucket_id = 'logo-restaurant');

DROP POLICY IF EXISTS "Auth Insert Logo" ON storage.objects;
CREATE POLICY "Auth Insert Logo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logo-restaurant' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Update Logo" ON storage.objects;
CREATE POLICY "Auth Update Logo" ON storage.objects FOR UPDATE USING (bucket_id = 'logo-restaurant' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Delete Logo" ON storage.objects;
CREATE POLICY "Auth Delete Logo" ON storage.objects FOR DELETE USING (bucket_id = 'logo-restaurant' AND auth.role() = 'authenticated');

-- 3. Policies for 'image-app' bucket
DROP POLICY IF EXISTS "Public Read App" ON storage.objects;
CREATE POLICY "Public Read App" ON storage.objects FOR SELECT USING (bucket_id = 'image-app');

DROP POLICY IF EXISTS "Auth Insert App" ON storage.objects;
CREATE POLICY "Auth Insert App" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'image-app' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Update App" ON storage.objects;
CREATE POLICY "Auth Update App" ON storage.objects FOR UPDATE USING (bucket_id = 'image-app' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Delete App" ON storage.objects;
CREATE POLICY "Auth Delete App" ON storage.objects FOR DELETE USING (bucket_id = 'image-app' AND auth.role() = 'authenticated');
