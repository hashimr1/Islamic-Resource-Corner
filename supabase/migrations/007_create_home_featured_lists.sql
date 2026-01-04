-- =====================================================
-- Migration: Homepage Featured Lists
-- =====================================================
-- Creates a curated lists table to power the dynamic homepage section.
-- Admins manage the lists; everyone can read them.

CREATE TABLE IF NOT EXISTS public.home_featured_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filter_criteria JSONB NOT NULL DEFAULT '{"grades": [], "topics": [], "types": [], "curriculum": []}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful index for fetching active lists in order
CREATE INDEX IF NOT EXISTS idx_home_featured_lists_active_order
  ON public.home_featured_lists (is_active, display_order);

-- Enable Row Level Security
ALTER TABLE public.home_featured_lists ENABLE ROW LEVEL SECURITY;

-- Read access for everyone
CREATE POLICY "Anyone can read featured lists"
  ON public.home_featured_lists
  FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Admins can insert featured lists"
  ON public.home_featured_lists
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update featured lists"
  ON public.home_featured_lists
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete featured lists"
  ON public.home_featured_lists
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grants to allow access through Supabase roles (RLS still applies)
GRANT SELECT ON public.home_featured_lists TO anon, authenticated;
GRANT ALL ON public.home_featured_lists TO service_role;


