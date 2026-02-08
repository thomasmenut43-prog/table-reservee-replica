-- Insérer le profil admin pour thomas.menut43@gmail.com
-- Remplace 'YOUR_USER_ID' par l'UUID de ton utilisateur (visible dans Authentication > Users)

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'admin',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'thomas.menut43@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Insérer aussi les autres utilisateurs existants
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'role', 'restaurateur'),
  NOW(),
  NOW()
FROM auth.users 
WHERE email != 'thomas.menut43@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Vérifier les profils créés
SELECT * FROM public.profiles;
