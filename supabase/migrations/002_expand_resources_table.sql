-- =====================================================
-- Migration: Expand Resources Table for Comprehensive Upload Form
-- =====================================================
-- This migration adds extensive metadata fields to support the detailed upload form

-- Add new columns to resources table
ALTER TABLE public.resources
  -- Short description (summary)
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  
  -- Array fields for multiple selections
  ADD COLUMN IF NOT EXISTS grades TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resource_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_islamic TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics_general TEXT[] DEFAULT '{}',
  
  -- Credit and copyright
  ADD COLUMN IF NOT EXISTS credits TEXT,
  ADD COLUMN IF NOT EXISTS copyright_verified BOOLEAN DEFAULT false NOT NULL,
  
  -- Preview/featured image
  ADD COLUMN IF NOT EXISTS preview_image_url TEXT,
  
  -- Additional metadata
  ADD COLUMN IF NOT EXISTS file_size BIGINT, -- File size in bytes
  ADD COLUMN IF NOT EXISTS file_type TEXT; -- MIME type

-- Create indexes for array columns to enable efficient filtering
CREATE INDEX IF NOT EXISTS idx_resources_grades ON public.resources USING GIN (grades);
CREATE INDEX IF NOT EXISTS idx_resources_subjects ON public.resources USING GIN (subjects);
CREATE INDEX IF NOT EXISTS idx_resources_resource_types ON public.resources USING GIN (resource_types);
CREATE INDEX IF NOT EXISTS idx_resources_topics_islamic ON public.resources USING GIN (topics_islamic);
CREATE INDEX IF NOT EXISTS idx_resources_topics_general ON public.resources USING GIN (topics_general);

-- Update existing records to have empty arrays instead of NULL
UPDATE public.resources
SET 
  grades = COALESCE(grades, '{}'),
  subjects = COALESCE(subjects, '{}'),
  resource_types = COALESCE(resource_types, '{}'),
  topics_islamic = COALESCE(topics_islamic, '{}'),
  topics_general = COALESCE(topics_general, '{}')
WHERE 
  grades IS NULL OR
  subjects IS NULL OR
  resource_types IS NULL OR
  topics_islamic IS NULL OR
  topics_general IS NULL;

-- Add comment to the table
COMMENT ON COLUMN public.resources.short_description IS 'Brief summary of the resource (1-2 sentences)';
COMMENT ON COLUMN public.resources.grades IS 'Target grade levels for this resource';
COMMENT ON COLUMN public.resources.subjects IS 'Subject categories (Islamic Studies, Arabic, Math, etc.)';
COMMENT ON COLUMN public.resources.resource_types IS 'Type of resource (Worksheet, Game, Poster, etc.)';
COMMENT ON COLUMN public.resources.topics_islamic IS 'Islamic topics covered (Seerah, Fiqh, Aqeedah, etc.)';
COMMENT ON COLUMN public.resources.topics_general IS 'General topics covered (Seasons, Animals, Colors, etc.)';
COMMENT ON COLUMN public.resources.credits IS 'Attribution text for the resource creator';
COMMENT ON COLUMN public.resources.copyright_verified IS 'User has verified they have rights to distribute this content';
COMMENT ON COLUMN public.resources.preview_image_url IS 'URL to preview/featured image for the resource';

-- =====================================================
-- STORAGE BUCKETS SETUP
-- =====================================================
-- Create storage buckets for resource files and thumbnails

-- Insert storage buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('resource-files', 'resource-files', true),
  ('resource-thumbnails', 'resource-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload resource files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resource files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resource files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public can read resource files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read thumbnails" ON storage.objects;

-- Storage Policies for resource-files bucket
CREATE POLICY "Authenticated users can upload resource files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resource-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own resource files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resource-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own resource files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resource-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read resource files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resource-files');

-- Storage Policies for resource-thumbnails bucket
CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resource-thumbnails' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own thumbnails"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resource-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resource-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resource-thumbnails');

