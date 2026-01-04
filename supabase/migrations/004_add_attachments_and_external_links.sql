-- =====================================================
-- Migration: Add attachments and external_links to resources
-- =====================================================

-- Ensure pgcrypto is available for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add new JSONB columns for files and links
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS external_links JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.resources.attachments IS 'Array of uploaded files: [{ id, name, url, size, type }]';
COMMENT ON COLUMN public.resources.external_links IS 'Array of external resources: [{ title, url }]';

-- Normalize any existing NULLs to empty arrays
UPDATE public.resources
SET
  attachments = COALESCE(attachments, '[]'::jsonb),
  external_links = COALESCE(external_links, '[]'::jsonb)
WHERE attachments IS NULL OR external_links IS NULL;

-- Backfill attachments from legacy file_url/file_size/file_type columns
UPDATE public.resources
SET attachments = attachments || jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name',
      COALESCE(
        NULLIF(split_part(file_url, '/', array_length(string_to_array(file_url, '/'), 1)), ''),
        'Resource file'
      ),
    'url', file_url,
    'size', COALESCE(file_size::text, ''),
    'type', COALESCE(file_type, '')
  )
)
WHERE file_url IS NOT NULL AND jsonb_array_length(COALESCE(attachments, '[]'::jsonb)) = 0;

-- Keep defaults consistent for future rows
ALTER TABLE public.resources
  ALTER COLUMN attachments SET DEFAULT '[]'::jsonb,
  ALTER COLUMN external_links SET DEFAULT '[]'::jsonb;

