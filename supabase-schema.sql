-- ================================================
-- Instagram Reels Dashboard - Supabase Schema
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_id  TEXT UNIQUE,
  username      TEXT,
  access_token  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile" ON public.users
  FOR ALL USING (id = auth.uid());

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1',
  icon       TEXT DEFAULT '📌',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (user_id = auth.uid());

-- REELS TABLE
CREATE TABLE IF NOT EXISTS public.reels (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_id                UUID REFERENCES public.categories(id) ON DELETE SET NULL,

  -- Core data
  url                        TEXT NOT NULL,
  instagram_id               TEXT,
  title                      TEXT,
  description                TEXT,

  -- Gemini analysis
  gemini_summary             TEXT,
  gemini_transcript          TEXT,
  gemini_tags                TEXT[],
  gemini_category_suggestion TEXT,
  analysis_status            TEXT DEFAULT 'pending'
                             CHECK (analysis_status IN ('pending','processing','done','failed')),

  -- Media
  thumbnail_url              TEXT,
  external_thumbnail         TEXT,

  -- Author info
  author_username            TEXT,
  author_name                TEXT,

  -- User data
  notes                      TEXT,
  is_favorite                BOOLEAN DEFAULT FALSE,

  -- Timestamps
  saved_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON public.reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_category_id ON public.reels(category_id);
CREATE INDEX IF NOT EXISTS idx_reels_saved_at ON public.reels(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_is_favorite ON public.reels(is_favorite);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_reels_fts ON public.reels
  USING gin(to_tsvector('german',
    coalesce(title,'') || ' ' ||
    coalesce(gemini_summary,'') || ' ' ||
    coalesce(gemini_transcript,'') || ' ' ||
    coalesce(author_username,'')
  ));

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reels" ON public.reels
  FOR ALL USING (user_id = auth.uid());

-- STORAGE BUCKET (run separately in Supabase Storage settings or via dashboard)
-- Bucket name: "thumbnails"
-- Public: true
-- Max size: 2MB

-- ================================================
-- DEFAULT CATEGORIES (nach Login ausführen mit user_id)
-- Ersetze 'DEINE-USER-ID' mit deiner tatsächlichen auth.uid()
-- ================================================
/*
INSERT INTO public.categories (user_id, name, slug, color, icon, sort_order) VALUES
  ('DEINE-USER-ID', 'Business Ideas', 'business-ideas', '#10b981', '💡', 1),
  ('DEINE-USER-ID', 'KI',             'ki',             '#8b5cf6', '🤖', 2),
  ('DEINE-USER-ID', 'Claude',         'claude',         '#f59e0b', '🧠', 3),
  ('DEINE-USER-ID', 'Gemini',         'gemini',         '#3b82f6', '✨', 4),
  ('DEINE-USER-ID', 'OpenAI',         'openai',         '#14b8a6', '⚡', 5),
  ('DEINE-USER-ID', 'Religion',       'religion',       '#ec4899', '🌙', 6),
  ('DEINE-USER-ID', 'Sport',          'sport',          '#f97316', '⚽', 7),
  ('DEINE-USER-ID', 'Lustig',         'lustig',         '#eab308', '😂', 8),
  ('DEINE-USER-ID', 'Sonstige',       'sonstige',       '#71717a', '📌', 9);
*/

-- ================================================
-- MIGRATION: Fehlende Spalten hinzufügen
-- Falls Tabellen bereits existieren, diese SQL ausführen:
-- ================================================

-- type-Spalte zu categories (unterscheidet category vs profile)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'category'
  CHECK (type IN ('category', 'profile'));

-- profile_id zu reels (zweite Kategorie-Referenz für Profile)
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
