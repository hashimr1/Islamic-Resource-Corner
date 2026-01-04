-- =====================================================
-- Function: search_resources
-- Purpose : Centralized filtering for the browse page
-- =====================================================
create or replace function public.search_resources(
  p_q text default null,
  p_grades text[] default '{}',
  p_subjects text[] default '{}',
  p_types text[] default '{}',
  p_topics text[] default '{}',
  p_sort text default 'newest',
  p_page integer default 1,
  p_page_size integer default 12
)
returns table (
  id uuid,
  title text,
  short_description text,
  preview_image_url text,
  target_grades text[],
  resource_types text[],
  downloads integer,
  created_at timestamptz,
  total_count bigint
) as $$
with filtered as (
  select r.*
  from public.resources r
  where r.status = 'approved'
    and (
      coalesce(p_q, '') = ''
      or (r.title ilike '%' || p_q || '%' or r.description ilike '%' || p_q || '%')
    )
    and (
      coalesce(array_length(p_grades, 1), 0) = 0
      or r.target_grades && p_grades
    )
    and (
      coalesce(array_length(p_subjects, 1), 0) = 0
      or r.subjects && p_subjects
    )
    and (
      coalesce(array_length(p_types, 1), 0) = 0
      or r.resource_types && p_types
    )
    and (
      coalesce(array_length(p_topics, 1), 0) = 0
      or (
        r.topics_quran && p_topics or
        r.topics_duas_ziyarat && p_topics or
        r.topics_aqaid && p_topics or
        r.topics_fiqh && p_topics or
        r.topics_akhlaq && p_topics or
        r.topics_tarikh && p_topics or
        r.topics_personalities && p_topics or
        r.topics_islamic_months && p_topics or
        r.topics_languages && p_topics or
        r.topics_other && p_topics
      )
    )
)
select
  f.id,
  f.title,
  f.short_description,
  f.preview_image_url,
  f.target_grades,
  f.resource_types,
  f.downloads,
  f.created_at,
  count(*) over() as total_count
from filtered f
order by
  case when p_sort = 'oldest' then f.created_at end asc,
  case when p_sort = 'popular' then f.downloads end desc,
  f.created_at desc
limit p_page_size
offset greatest(p_page - 1, 0) * p_page_size;
$$ language sql stable;

