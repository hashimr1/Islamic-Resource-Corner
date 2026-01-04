-- 1. Add slug column (nullable first to avoid errors with existing data)
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Create a unique index on the slug column
CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_slug ON public.resources(slug);

-- 3. (Optional) If you want to require slugs immediately and have data, 
-- you would need to backfill existing NULL slugs before setting NOT NULL.
-- For now, we leave it nullable so you can manually update your test data.
