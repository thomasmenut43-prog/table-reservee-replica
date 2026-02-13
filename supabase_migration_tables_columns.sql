-- ============================================================
-- Migration : colonnes manquantes + table map_objects
-- Exécuter ce script une fois dans Supabase > SQL Editor > Run
--
-- Sans cette migration, les murs/piliers/bar du plan sont stockés
-- en localStorage (fallback). Après exécution, tout est persisté en base.
-- ============================================================

-- Colonnes pour "tables"
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS floor_plan_id TEXT;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'square';
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 60;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 40;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS position_x INTEGER DEFAULT 0;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS position_y INTEGER DEFAULT 0;

-- Table map_objects (murs, piliers, bar du plan)
CREATE TABLE IF NOT EXISTS public.map_objects (
  id TEXT PRIMARY KEY DEFAULT ('obj_' || substr(md5(random()::text), 1, 8)),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  floor_plan_id TEXT,
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
ALTER TABLE public.map_objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read map_objects" ON public.map_objects;
CREATE POLICY "Public read map_objects" ON public.map_objects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can modify map_objects" ON public.map_objects;
CREATE POLICY "Authenticated can modify map_objects" ON public.map_objects FOR ALL USING (auth.role() = 'authenticated');

-- Colonnes pour table_blocks (début/fin avec heure)
ALTER TABLE public.table_blocks ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMPTZ;
ALTER TABLE public.table_blocks ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMPTZ;
