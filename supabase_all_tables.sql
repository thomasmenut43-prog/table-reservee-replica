-- =============================================
-- SETUP COMPLET SUPABASE - Toutes les tables de l'application
-- Exécute ce script dans Supabase SQL Editor
-- =============================================

-- ==================== RESTAURANTS ====================
DROP TABLE IF EXISTS public.restaurants CASCADE;
CREATE TABLE public.restaurants (
  id TEXT PRIMARY KEY DEFAULT ('rest_' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  cover_photo TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  cuisine_tags JSONB DEFAULT '[]'::jsonb,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  online_booking_enabled BOOLEAN DEFAULT true,
  auto_confirm_enabled BOOLEAN DEFAULT true,
  meal_duration_minutes INTEGER DEFAULT 90,
  slot_interval_minutes INTEGER DEFAULT 15,
  min_advance_minutes INTEGER DEFAULT 60,
  booking_window_days INTEGER DEFAULT 60,
  group_pending_threshold INTEGER DEFAULT 8,
  table_joining_enabled BOOLEAN DEFAULT true,
  deposit_enabled BOOLEAN DEFAULT false,
  rating_avg DECIMAL(2, 1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== FLOOR PLANS (avant tables, pour la FK) ====================
DROP TABLE IF EXISTS public.floor_plans CASCADE;
CREATE TABLE public.floor_plans (
  id TEXT PRIMARY KEY DEFAULT ('floor_' || substr(md5(random()::text), 1, 8)),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT,
  is_default BOOLEAN DEFAULT false,
  layout JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== TABLES ====================
DROP TABLE IF EXISTS public.tables CASCADE;
CREATE TABLE public.tables (
  id TEXT PRIMARY KEY DEFAULT ('table_' || substr(md5(random()::text), 1, 8)),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  floor_plan_id TEXT REFERENCES public.floor_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seats INTEGER DEFAULT 4,
  zone TEXT DEFAULT 'main',
  shape TEXT DEFAULT 'square',
  is_joinable BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 60,
  height INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SERVICE SCHEDULES ====================
DROP TABLE IF EXISTS public.service_schedules CASCADE;
CREATE TABLE public.service_schedules (
  id TEXT PRIMARY KEY DEFAULT ('sched_' || substr(md5(random()::text), 1, 8)),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 6 = Saturday
  service_type TEXT CHECK (service_type IN ('MIDI', 'SOIR')),
  is_open BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RESERVATIONS ====================
DROP TABLE IF EXISTS public.reservations CASCADE;
CREATE TABLE public.reservations (
  id TEXT PRIMARY KEY DEFAULT ('res_' || substr(md5(random()::text), 1, 8)),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_ids JSONB DEFAULT '[]'::jsonb,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  guests_count INTEGER DEFAULT 2,
  service_type TEXT CHECK (service_type IN ('MIDI', 'SOIR')),
  date_time_start TIMESTAMPTZ NOT NULL,
  date_time_end TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  reference TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== REVIEWS ====================
DROP TABLE IF EXISTS public.reviews CASCADE;
CREATE TABLE public.reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev_' || substr(md5(random()::text), 1, 8)),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  author_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== TABLE BLOCKS ====================
DROP TABLE IF EXISTS public.table_blocks CASCADE;
CREATE TABLE public.table_blocks (
  id TEXT PRIMARY KEY DEFAULT ('block_' || substr(md5(random()::text), 1, 8)),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id TEXT,
  start_date DATE,
  end_date DATE,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== MAP OBJECTS (murs, piliers, bar) ====================
DROP TABLE IF EXISTS public.map_objects CASCADE;
CREATE TABLE public.map_objects (
  id TEXT PRIMARY KEY DEFAULT ('obj_' || substr(md5(random()::text), 1, 8)),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  floor_plan_id TEXT REFERENCES public.floor_plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 60,
  height INTEGER DEFAULT 40,
  rotation INTEGER DEFAULT 0,
  color TEXT,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PLATFORM SETTINGS ====================
DROP TABLE IF EXISTS public.platform_settings CASCADE;
CREATE TABLE public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT ('settings_' || substr(md5(random()::text), 1, 8)),
  setting_key TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_description TEXT,
  banner_ad_url TEXT,
  banner_ad_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RLS POLICIES ====================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour restaurants
CREATE POLICY "Public read restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Authenticated can modify restaurants" ON public.restaurants FOR ALL USING (auth.role() = 'authenticated');

-- Tables liées aux restaurants
CREATE POLICY "Public read tables" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Authenticated can modify tables" ON public.tables FOR ALL USING (auth.role() = 'authenticated');

-- Horaires
CREATE POLICY "Public read schedules" ON public.service_schedules FOR SELECT USING (true);
CREATE POLICY "Authenticated can modify schedules" ON public.service_schedules FOR ALL USING (auth.role() = 'authenticated');

-- Réservations
CREATE POLICY "Public can create reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can manage reservations" ON public.reservations FOR ALL USING (auth.role() = 'authenticated');

-- Avis
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Plans de salle
CREATE POLICY "Public read floor_plans" ON public.floor_plans FOR SELECT USING (true);
CREATE POLICY "Authenticated can modify floor_plans" ON public.floor_plans FOR ALL USING (auth.role() = 'authenticated');

-- Blocages de tables
CREATE POLICY "Public read table_blocks" ON public.table_blocks FOR SELECT USING (true);
CREATE POLICY "Authenticated can modify table_blocks" ON public.table_blocks FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read map_objects" ON public.map_objects FOR SELECT USING (true);
CREATE POLICY "Authenticated can modify map_objects" ON public.map_objects FOR ALL USING (auth.role() = 'authenticated');

-- Paramètres plateforme
CREATE POLICY "Public read settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated can modify settings" ON public.platform_settings FOR ALL USING (auth.role() = 'authenticated');

-- ==================== DONNÉES INITIALES ====================
INSERT INTO public.platform_settings (id, setting_key, hero_title, hero_subtitle, hero_description)
VALUES ('settings_1', 'design', 'Réservez votre table', 'en quelques clics', 
'Découvrez les meilleurs restaurants de votre ville et réservez facilement votre table.');

-- ==================== VÉRIFICATION ====================
SELECT 'Tables créées avec succès!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
