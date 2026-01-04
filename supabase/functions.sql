-- =====================================================
-- Additional Database Functions
-- =====================================================
-- These functions provide helper utilities for the application

-- Function to increment download count atomically
CREATE OR REPLACE FUNCTION increment_downloads(resource_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.resources
  SET downloads = downloads + 1
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get resources by category with pagination
CREATE OR REPLACE FUNCTION get_resources_by_category(
  p_category TEXT DEFAULT NULL,
  p_grade_level TEXT DEFAULT NULL,
  p_limit INT DEFAULT 12,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  file_url TEXT,
  category TEXT,
  grade_level TEXT,
  status TEXT,
  user_id UUID,
  downloads INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    r.file_url,
    r.category,
    r.grade_level,
    r.status,
    r.user_id,
    r.downloads,
    r.created_at,
    r.updated_at
  FROM public.resources r
  WHERE 
    r.status = 'approved'
    AND (p_category IS NULL OR r.category = p_category)
    AND (p_grade_level IS NULL OR r.grade_level = p_grade_level)
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_uploads INT,
  approved_resources INT,
  pending_resources INT,
  rejected_resources INT,
  total_downloads INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT as total_uploads,
    COUNT(*) FILTER (WHERE status = 'approved')::INT as approved_resources,
    COUNT(*) FILTER (WHERE status = 'pending')::INT as pending_resources,
    COUNT(*) FILTER (WHERE status = 'rejected')::INT as rejected_resources,
    COALESCE(SUM(downloads), 0)::INT as total_downloads
  FROM public.resources
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_resources INT,
  pending_resources INT,
  approved_resources INT,
  rejected_resources INT,
  total_users INT,
  total_contributors INT,
  total_downloads INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INT FROM public.resources) as total_resources,
    (SELECT COUNT(*)::INT FROM public.resources WHERE status = 'pending') as pending_resources,
    (SELECT COUNT(*)::INT FROM public.resources WHERE status = 'approved') as approved_resources,
    (SELECT COUNT(*)::INT FROM public.resources WHERE status = 'rejected') as rejected_resources,
    (SELECT COUNT(*)::INT FROM public.profiles) as total_users,
    (SELECT COUNT(DISTINCT user_id)::INT FROM public.resources) as total_contributors,
    (SELECT COALESCE(SUM(downloads), 0)::INT FROM public.resources WHERE status = 'approved') as total_downloads;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

