-- ============================================================
-- Configurer Tom.marcon@live.fr comme RESTAURATEUR
-- Exécuter dans Supabase > SQL Editor > Run
-- ============================================================
-- Ce script assigne le rôle "restaurateur" et un restaurant
-- au compte test, pour qu'il accède au back-office (et non à "Mes réservations").

-- 1. Mettre à jour le profil : role = restaurateur + assigner le 1er restaurant (si existant)
UPDATE public.profiles p
SET 
  role = 'restaurateur',
  restaurant_id = COALESCE((SELECT id FROM public.restaurants LIMIT 1), p.restaurant_id),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND LOWER(u.email) = 'tom.marcon@live.fr';

-- 2. S'assurer que le profil existe (si l'utilisateur existe dans auth.users mais pas dans profiles)
INSERT INTO public.profiles (id, email, full_name, role, restaurant_id, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'restaurateur',
  (SELECT id FROM public.restaurants LIMIT 1),
  NOW(),
  NOW()
FROM auth.users u
WHERE LOWER(u.email) = 'tom.marcon@live.fr'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id)
ON CONFLICT (id) DO UPDATE SET
  role = 'restaurateur',
  restaurant_id = COALESCE(profiles.restaurant_id, (SELECT id FROM public.restaurants LIMIT 1)),
  updated_at = NOW();

-- Vérifier le résultat
SELECT p.id, p.email, p.role, p.restaurant_id, r.name as restaurant_name
FROM public.profiles p
LEFT JOIN public.restaurants r ON r.id = p.restaurant_id
WHERE LOWER(p.email) = 'tom.marcon@live.fr';
