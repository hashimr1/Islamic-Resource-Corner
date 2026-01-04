-- =====================================================
-- Migration: Allow link-only resources (file_url nullable)
-- =====================================================

ALTER TABLE public.resources
  ALTER COLUMN file_url DROP NOT NULL,
  ALTER COLUMN file_url SET DEFAULT NULL;

-- Optional: keep file_size/file_type nullable (they likely already are)

