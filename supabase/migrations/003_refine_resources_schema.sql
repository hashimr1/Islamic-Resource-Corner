-- =====================================================
-- Migration: Refine Resources Schema for Detailed Categorization
-- =====================================================

-- Drop old columns that we're replacing with more specific ones
ALTER TABLE public.resources
  DROP COLUMN IF EXISTS grades,
  DROP COLUMN IF EXISTS subjects,
  DROP COLUMN IF EXISTS resource_types,
  DROP COLUMN IF EXISTS topics_islamic,
  DROP COLUMN IF EXISTS topics_general,
  DROP COLUMN IF EXISTS grade_level,
  DROP COLUMN IF EXISTS category;

-- Add refined categorization columns
ALTER TABLE public.resources
  -- Required categorization
  ADD COLUMN IF NOT EXISTS target_grades TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resource_types TEXT[] DEFAULT '{}',
  
  -- Optional topic tags (all stored as arrays)
  ADD COLUMN IF NOT EXISTS topics_quran TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_duas_ziyarat TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_aqaid TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_fiqh TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_akhlaq TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_tarikh TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_personalities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_islamic_months TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_languages TEXT[] DEFAULT '{}',
  
  -- Additional images (multiple)
  ADD COLUMN IF NOT EXISTS additional_images TEXT[] DEFAULT '{}',
  
  -- Credit options
  ADD COLUMN IF NOT EXISTS credit_organization TEXT,
  ADD COLUMN IF NOT EXISTS credit_other TEXT;

-- Update the credits column to be credit_organization
-- (We'll keep the old 'credits' column for backward compatibility but rename it conceptually)

-- Create GIN indexes for efficient array filtering
CREATE INDEX IF NOT EXISTS idx_resources_target_grades ON public.resources USING GIN (target_grades);
CREATE INDEX IF NOT EXISTS idx_resources_resource_types ON public.resources USING GIN (resource_types);
CREATE INDEX IF NOT EXISTS idx_resources_topics_quran ON public.resources USING GIN (topics_quran);
CREATE INDEX IF NOT EXISTS idx_resources_topics_duas_ziyarat ON public.resources USING GIN (topics_duas_ziyarat);
CREATE INDEX IF NOT EXISTS idx_resources_topics_aqaid ON public.resources USING GIN (topics_aqaid);
CREATE INDEX IF NOT EXISTS idx_resources_topics_fiqh ON public.resources USING GIN (topics_fiqh);
CREATE INDEX IF NOT EXISTS idx_resources_topics_akhlaq ON public.resources USING GIN (topics_akhlaq);
CREATE INDEX IF NOT EXISTS idx_resources_topics_tarikh ON public.resources USING GIN (topics_tarikh);
CREATE INDEX IF NOT EXISTS idx_resources_topics_personalities ON public.resources USING GIN (topics_personalities);
CREATE INDEX IF NOT EXISTS idx_resources_topics_islamic_months ON public.resources USING GIN (topics_islamic_months);
CREATE INDEX IF NOT EXISTS idx_resources_topics_languages ON public.resources USING GIN (topics_languages);

-- Add comments for documentation
COMMENT ON COLUMN public.resources.target_grades IS 'Target grade levels (Preschool, Kindergarten, Grade 1-12)';
COMMENT ON COLUMN public.resources.resource_types IS 'Types of resource (Workbook, Worksheet, Video, etc.)';
COMMENT ON COLUMN public.resources.topics_quran IS 'Qurʾān-related topics (Reading, Memorization, Tajwīd, etc.)';
COMMENT ON COLUMN public.resources.topics_duas_ziyarat IS 'Duʿās and Ziyārāt';
COMMENT ON COLUMN public.resources.topics_aqaid IS 'Beliefs (Tawḥīd, Nubuwwah, Imāmah, etc.)';
COMMENT ON COLUMN public.resources.topics_fiqh IS 'Islamic laws (Ṣalāh, Ṣawm, Ḥajj, etc.)';
COMMENT ON COLUMN public.resources.topics_akhlaq IS 'Etiquette and moral topics';
COMMENT ON COLUMN public.resources.topics_tarikh IS 'Historical events and occasions';
COMMENT ON COLUMN public.resources.topics_personalities IS 'Islamic personalities (Prophet, Imams, etc.)';
COMMENT ON COLUMN public.resources.topics_islamic_months IS 'Islamic calendar months';
COMMENT ON COLUMN public.resources.topics_languages IS 'Languages available for the resource';
COMMENT ON COLUMN public.resources.additional_images IS 'Additional preview images (URLs)';
COMMENT ON COLUMN public.resources.credit_organization IS 'Organization to credit for the resource';
COMMENT ON COLUMN public.resources.credit_other IS 'Custom credit text if organization is "Other"';

-- Update existing records to have empty arrays instead of NULL
UPDATE public.resources
SET 
  target_grades = COALESCE(target_grades, '{}'),
  resource_types = COALESCE(resource_types, '{}'),
  topics_quran = COALESCE(topics_quran, '{}'),
  topics_duas_ziyarat = COALESCE(topics_duas_ziyarat, '{}'),
  topics_aqaid = COALESCE(topics_aqaid, '{}'),
  topics_fiqh = COALESCE(topics_fiqh, '{}'),
  topics_akhlaq = COALESCE(topics_akhlaq, '{}'),
  topics_tarikh = COALESCE(topics_tarikh, '{}'),
  topics_personalities = COALESCE(topics_personalities, '{}'),
  topics_islamic_months = COALESCE(topics_islamic_months, '{}'),
  topics_languages = COALESCE(topics_languages, '{}'),
  additional_images = COALESCE(additional_images, '{}')
WHERE 
  target_grades IS NULL OR
  resource_types IS NULL OR
  topics_quran IS NULL OR
  topics_duas_ziyarat IS NULL OR
  topics_aqaid IS NULL OR
  topics_fiqh IS NULL OR
  topics_akhlaq IS NULL OR
  topics_tarikh IS NULL OR
  topics_personalities IS NULL OR
  topics_islamic_months IS NULL OR
  topics_languages IS NULL OR
  additional_images IS NULL;

