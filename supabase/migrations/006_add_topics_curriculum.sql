-- =====================================================
-- Migration: Add curriculum topics array
-- =====================================================

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS topics_curriculum TEXT[] DEFAULT '{}';

-- Ensure existing rows have empty array instead of NULL
UPDATE public.resources
SET topics_curriculum = COALESCE(topics_curriculum, '{}')
WHERE topics_curriculum IS NULL;

-- Optional index for filtering
CREATE INDEX IF NOT EXISTS idx_resources_topics_curriculum ON public.resources USING GIN (topics_curriculum);

