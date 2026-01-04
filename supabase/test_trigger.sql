-- =====================================================
-- Test Trigger Function (Optional)
-- =====================================================
-- Run this AFTER fix_trigger_permissions.sql to verify everything works

-- Test 1: Check if function exists and has correct settings
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition,
  p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_new_user';

-- Test 2: Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Test 3: Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test 4: Check table permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Test 5: Verify profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Results Interpretation:
-- ✅ Function should show is_security_definer = true
-- ✅ Trigger should exist on auth.users table
-- ✅ Should see 3 RLS policies (SELECT, INSERT, UPDATE)
-- ✅ Service_role and authenticated should have permissions
-- ✅ All 10 columns should be present in profiles table

