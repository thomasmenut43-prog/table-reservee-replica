-- =============================================
-- ADD SUBSCRIPTION PLAN COLUMN
-- Exécute ce script dans Supabase SQL Editor
-- =============================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'pro', 'premium', 'none'));

-- Mettre à jour les profils existants pour avoir une valeur par défaut
UPDATE public.profiles 
SET subscription_plan = 'none' 
WHERE subscription_plan IS NULL;

-- Vérifier
SELECT id, email, subscription_status, subscription_plan FROM public.profiles LIMIT 10;
