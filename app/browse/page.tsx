import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Download } from 'lucide-react'

import BrowseHeader from '@/components/browse/browse-header'
import FilterSidebar from '@/components/browse/filter-sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = { [key: string]: string | string[] | undefined }
type ResourceRow = {
  id: string
  title: string
  short_description: string | null
  preview_image_url: string | null
  target_grades: string[] | null
  resource_types: string[] | null
  downloads: number | null
  created_at: string | null
}

function parseArrayParam(value: string | string[] | undefined) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value.split(',').filter(Boolean)
}

function buildPageHref(base: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params.toString())
  next.set('page', String(page))
  return `${base}?${next.toString()}`
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createSupabaseServerClient()

  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const grades = parseArrayParam(searchParams.grades)
  const types = parseArrayParam(searchParams.types)
  const topics = parseArrayParam(searchParams.topics)
  const curriculum = parseArrayParam(searchParams.curriculum)
  const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest'
  const page = Math.max(1, Number(searchParams.page) || 1)

  const paramsForLinks = new URLSearchParams()
  if (q) paramsForLinks.set('q', q)
  grades.forEach(value => paramsForLinks.append('grades', value))
  types.forEach(value => paramsForLinks.append('types', value))
  topics.forEach(value => paramsForLinks.append('topics', value))
  curriculum.forEach(value => paramsForLinks.append('curriculum', value))
  if (sortParam) paramsForLinks.set('sort', sortParam)

  const offset = (page - 1) * ITEMS_PER_PAGE
  const end = offset + ITEMS_PER_PAGE - 1

  let query = supabase
    .from('resources')
    .select(
      'id,title,short_description,preview_image_url,target_grades,resource_types,downloads,created_at',
      { count: 'exact' }
    )
    .eq('status', 'approved')

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }
  if (grades.length) {
    query = query.overlaps('target_grades', grades)
  }
  if (types.length) {
    query = query.overlaps('resource_types', types)
  }
  if (topics.length) {
    const topicCols = [
      'topics_quran',
      'topics_duas_ziyarat',
      'topics_aqaid',
      'topics_fiqh',
      'topics_akhlaq',
      'topics_tarikh',
      'topics_personalities',
      'topics_islamic_months',
      'topics_languages',
      'topics_other',
    ]
    const topicClause = topicCols
      .map(col => `${col}.ov.{${topics.join(',')}}`)
      .join(',')
    query = query.or(topicClause)
  }
  if (curriculum.length) {
    query = query.overlaps('topics_curriculum', curriculum)
  }

  if (sortParam === 'oldest') {
    query = query.order('created_at', { ascending: true })
  } else if (sortParam === 'popular') {
    query = query.order('downloads', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error, count } = (await query.range(offset, end)) as {
    data: ResourceRow[] | null
    error: any
    count: number | null
  }

  if (error) {
    console.error('Browse fetch error', error)
  }

  const resources = data ?? []
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))

  return (
    <div className="bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        <BrowseHeader totalCount={totalCount} initialQuery={q} sort={sortParam as any} />

        <div className="flex flex-col gap-6 lg:flex-row">
          <FilterSidebar />

          <div className="flex-1 space-y-6">
            {resources.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {resources.map(resource => (
                    <Link key={resource.id} href={`/resource/${resource.id}`} className="block h-full">
                      <Card className="h-full flex flex-col overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-primary/50">
                        {resource.preview_image_url ? (
                          <div className="relative h-44 w-full bg-muted overflow-hidden">
                            <img
                              src={resource.preview_image_url}
                              alt={resource.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-44 w-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                            No preview image
                          </div>
                        )}

                        <CardContent className="flex-1 p-4 space-y-3">
                          {resource.resource_types?.[0] ? (
                            <span className="inline-flex w-fit px-2 py-1 rounded-full bg-muted text-xs font-medium">
                              {resource.resource_types[0]}
                            </span>
                          ) : null}

                          <h3 className="font-semibold leading-tight line-clamp-1">{resource.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {resource.short_description || 'A helpful resource you may find useful.'}
                          </p>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Download className="h-3.5 w-3.5" />
                              {resource.downloads ?? 0} downloads
                            </span>
                            {resource.created_at ? (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(resource.created_at), 'PPP')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                —
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      asChild
                    >
                      <Link href={buildPageHref('/browse', paramsForLinks, Math.max(page - 1, 1))}>
                        Previous
                      </Link>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      asChild
                    >
                      <Link
                        href={buildPageHref(
                          '/browse',
                          paramsForLinks,
                          Math.min(page + 1, totalPages)
                        )}
                      >
                        Next
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-10 text-center space-y-4">
                <h3 className="text-xl font-semibold">No resources found</h3>
                <p className="text-muted-foreground">
                  Try clearing filters or adjusting your search terms to find more resources.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button asChild>
                    <Link href="/browse">Clear filters</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Back to home</Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

