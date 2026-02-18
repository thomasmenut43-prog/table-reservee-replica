-- ============================================================
-- Réservation en ligne : disponible pour les restaurants dont
-- le restaurateur a une offre active (abonnement).
-- Exécuter dans Supabase > SQL Editor
-- ============================================================

-- Colonne sur restaurants : reflète si le propriétaire (profil) a un abonnement actif
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS owner_has_active_subscription BOOLEAN DEFAULT false;

-- Backfill : à partir des profils, mettre à jour les restaurants
UPDATE public.restaurants r
SET owner_has_active_subscription = (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.restaurant_id = r.id
      AND p.subscription_status = 'active'
      AND p.subscription_end_date IS NOT NULL
      AND p.subscription_end_date > NOW()
  )
);

-- Optionnel : trigger pour garder la colonne à jour quand un profil change (abonnement)
-- Tu peux l'ajouter plus tard si tu préfères tout gérer côté app (AdminSubscriptions).
