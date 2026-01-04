-- =====================================================
-- Migration: Add topics_other column for miscellaneous tags
-- =====================================================

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS topics_other TEXT[] DEFAULT '{}';

-- GIN index for filtering by topics_other
CREATE INDEX IF NOT EXISTS idx_resources_topics_other ON public.resources USING GIN (topics_other);

-- Ensure no NULLs
UPDATE public.resources
SET topics_other = COALESCE(topics_other, '{}')
WHERE topics_other IS NULL;

COMMENT ON COLUMN public.resources.topics_other IS 'Miscellaneous topics (Bulūgh/Taklīf, New Muslims, Family, etc.)';


