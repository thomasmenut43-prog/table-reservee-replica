-- Ajouter les colonnes manquantes à la table restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Ajouter is_default aux plans de table (floor_plans)
ALTER TABLE public.floor_plans ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Colonnes manquantes pour les tables (plan de table, forme, statut, dimensions)
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS floor_plan_id TEXT;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'square';
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 60;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 40;

-- Vérifier la structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'restaurants';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'floor_plans';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tables';
