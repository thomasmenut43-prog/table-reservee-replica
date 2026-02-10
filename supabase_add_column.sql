-- Ajouter les colonnes manquantes à la table restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Vérifier la structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'restaurants';
