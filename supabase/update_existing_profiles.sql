-- =====================================================
-- Update Existing User Profiles
-- =====================================================
-- Run this if you have existing users that were created
-- before the enhanced profile fields were added

-- This script will:
-- 1. Extract names from full_name if first_name/last_name are missing
-- 2. Generate usernames from email if username is missing
-- 3. Set default values for other fields

-- Update profiles that are missing first_name and last_name
UPDATE profiles
SET 
  first_name = COALESCE(
    first_name,
    CASE 
      WHEN full_name IS NOT NULL AND full_name != '' THEN
        SPLIT_PART(full_name, ' ', 1)
      ELSE
        'User'
    END
  ),
  last_name = COALESCE(
    last_name,
    CASE 
      WHEN full_name IS NOT NULL AND full_name != '' AND ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 1 THEN
        SPLIT_PART(full_name, ' ', 2)
      ELSE
        ''
    END
  ),
  username = COALESCE(
    username,
    'user_' || SUBSTRING(id::text, 1, 8)
  ),
  country = COALESCE(country, 'Not specified'),
  occupation = COALESCE(occupation, 'Other')
WHERE 
  first_name IS NULL 
  OR last_name IS NULL 
  OR username IS NULL;

-- Regenerate full_name from first_name + last_name for consistency
UPDATE profiles
SET full_name = TRIM(first_name || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL OR full_name = '';

-- Show updated profiles
SELECT 
  id,
  email,
  first_name,
  last_name,
  full_name,
  username,
  country,
  occupation,
  role
FROM profiles
ORDER BY created_at DESC;

