import Image from 'next/image'
import Link from 'next/link'
import { Upload, Search, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser } from '@/lib/actions/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Force dynamic rendering to always show fresh auth state
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ELEMENTARY_GRADES = [
  'Preschool',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
] as const

const MIDDLE_GRADES = ['Grade 6', 'Grade 7', 'Grade 8'] as const

const HIGH_GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] as const

type FilterCriteria = {
  grades?: string[]
  topics?: string[]
  curriculum?: string[]
  types?: string[]
}

type FeaturedListRow = {
  id: string
  title: string
  filter_criteria: FilterCriteria | null
  display_order: number | null
}

type ResourcePreview = {
  id: string
  title: string
  short_description?: string | null
  description?: string | null
  preview_image_url?: string | null
  resource_types?: string[]
}

type FeaturedSection = {
  id: string
  title: string
  href: string
  resources: ResourcePreview[]
}

function buildGradesHref(grades: readonly string[]) {
  const encoded = grades.map(grade => encodeURIComponent(grade)).join(',')
  return `/browse?grades=${encoded}`
}

function buildBrowseHref(criteria: Required<FilterCriteria>) {
  const params = new URLSearchParams()
  criteria.grades.forEach(value => params.append('grades', value))
  criteria.types.forEach(value => params.append('types', value))
  criteria.topics.forEach(value => params.append('topics', value))
  criteria.curriculum.forEach(value => params.append('curriculum', value))
  const qs = params.toString()
  return qs ? `/browse?${qs}` : '/browse'
}

function normalizeCriteria(criteria: FilterCriteria | null | undefined): Required<FilterCriteria> {
  return {
    grades: Array.isArray(criteria?.grades) ? criteria?.grades : [],
    topics: Array.isArray(criteria?.topics) ? criteria?.topics : [],
    curriculum: Array.isArray(criteria?.curriculum) ? criteria?.curriculum : [],
    types: Array.isArray(criteria?.types) ? criteria?.types : [],
  }
}

function ResourceCard({ resource }: { resource: ResourcePreview }) {
  return (
    <Link key={resource.id} href={`/resource/${resource.id}`} className="block h-full">
      <Card className="h-full overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-primary/50">
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

        <CardContent className="p-4 space-y-3">
          {resource.resource_types?.[0] ? (
            <span className="inline-flex w-fit px-2 py-1 rounded-full bg-muted text-xs font-medium">
              {resource.resource_types[0]}
            </span>
          ) : null}

          <h3 className="font-semibold leading-tight line-clamp-2">{resource.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {resource.short_description ||
              resource.description ||
              'A helpful resource you may find useful.'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function ResourceSection({
  title,
  href,
  resources,
}: {
  title: string
  href: string
  resources: ResourcePreview[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
      </div>

      {resources.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {resources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No resources found yet.</p>
      )}

      <div className="flex justify-center">
        <Button asChild variant="outline" size="sm">
          <Link href={href}>View more</Link>
        </Button>
      </div>
    </div>
  )
}

async function fetchResourcesForCriteria(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  criteria: Required<FilterCriteria>,
  limit = 6
) {
  let query = supabase
    .from('resources')
    .select('id,title,short_description,description,preview_image_url,resource_types')
    .eq('status', 'approved')

  if (criteria.grades.length) {
    query = query.overlaps('target_grades', criteria.grades)
  }
  if (criteria.types.length) {
    query = query.overlaps('resource_types', criteria.types)
  }
  if (criteria.topics.length) {
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
    const topicClause = topicCols.map(col => `${col}.ov.{${criteria.topics.join(',')}}`).join(',')
    query = query.or(topicClause)
  }
  if (criteria.curriculum.length) {
    query = query.overlaps('topics_curriculum', criteria.curriculum)
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
  if (error) {
    console.error('Error fetching featured resources', error)
    return []
  }

  return data || []
}

export default async function HomePage() {
  const userData = (await getCurrentUser()) as any
  const supabase = createSupabaseServerClient()

  const featuredListsResponse = (await supabase
    .from('home_featured_lists')
    .select('id,title,filter_criteria,display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(3)) as { data: FeaturedListRow[] | null; error: any }

  const [elementaryResponse, middleResponse, highResponse] = await Promise.all([
    supabase
      .from('resources')
      .select(
        'id,title,short_description,description,preview_image_url,resource_types,target_grades'
      )
      .eq('status', 'approved')
      .overlaps('target_grades', [...ELEMENTARY_GRADES])
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('resources')
      .select(
        'id,title,short_description,description,preview_image_url,resource_types,target_grades'
      )
      .eq('status', 'approved')
      .overlaps('target_grades', [...MIDDLE_GRADES])
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('resources')
      .select(
        'id,title,short_description,description,preview_image_url,resource_types,target_grades'
      )
      .eq('status', 'approved')
      .overlaps('target_grades', [...HIGH_GRADES])
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const featuredLists = featuredListsResponse?.data ?? []
  const elementaryResources = elementaryResponse.data || []
  const middleResources = middleResponse.data || []
  const highResources = highResponse.data || []

  const featuredSections: FeaturedSection[] = await Promise.all(
    featuredLists.map(async list => {
      const criteria = normalizeCriteria(list.filter_criteria)
      const resources = await fetchResourcesForCriteria(supabase, criteria, 6)
      return {
        id: list.id,
        title: list.title,
        href: buildBrowseHref(criteria),
        resources,
      }
    })
  )

  const gradeSections = [
    {
      title: 'Elementary School Resources',
      href: buildGradesHref(ELEMENTARY_GRADES),
      resources: elementaryResources,
    },
    {
      title: 'Middle School Resources',
      href: buildGradesHref(MIDDLE_GRADES),
      resources: middleResources,
    },
    {
      title: 'High School Resources',
      href: buildGradesHref(HIGH_GRADES),
      resources: highResources,
    },
  ]

  return (
    <div className="flex flex-col">
      <section className="px-4 mt-6">
        <div className="relative w-full max-w-7xl mx-auto min-h-[500px] overflow-hidden rounded-3xl">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80"
              alt="Students studying together"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          </div>

          <div className="relative z-10 flex items-center min-h-[500px] md:min-h-[60vh]">
            <div className="w-full px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
              <div className="max-w-3xl space-y-6">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">
                  Welcome to Islamic Resource Corner
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Discover, download, and share quality Islamic educational materials.
          </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                  Join our community of teachers, parents, and students. Discover, download, and share
                  quality materials.
          </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="text-lg font-semibold bg-primary text-white hover:bg-primary/90"
                  >
              <Link href="/browse">
                <Search className="mr-2 h-5 w-5" />
                      Browse
              </Link>
            </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-lg font-semibold bg-white text-black hover:bg-gray-100 border-none"
                  >
                    <Link href={userData ? '/dashboard/upload' : '/auth/signup'}>
                <Upload className="mr-2 h-5 w-5" />
                      {userData ? 'Upload' : 'Sign Up'}
              </Link>
            </Button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {featuredSections.length ? (
        <section className="py-16 px-4 bg-background">
          <div className="container max-w-6xl mx-auto space-y-12">
            <div className="space-y-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Featured Resources</h2>
              </div>
              <div className="space-y-10">
                {featuredSections.map((section, index) => (
                  <div key={section.id}>
                    <ResourceSection
                      title={section.title}
                      href={section.href}
                      resources={section.resources}
                    />
                    {index < featuredSections.length - 1 ? <Separator className="mt-8" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-16 px-4 bg-background">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Discover Resources</CardTitle>
                <CardDescription>
                  Browse our collection of Islamic educational materials by category, grade level, or keyword.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Share Your Work</CardTitle>
                <CardDescription>
                  Sign up as a contributor and upload your own Islamic educational resources to help the community.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Quality Assured</CardTitle>
                <CardDescription>
                  All resources are reviewed by admins before being published to ensure quality and appropriateness.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="container max-w-6xl mx-auto space-y-12">
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Explore by Grade</h2>
          </div>

            <div className="space-y-10">
              {gradeSections.map((section, index) => (
                <div key={section.title}>
                  <ResourceSection
                    title={section.title}
                    href={section.href}
                    resources={section.resources}
                  />
                  {index < gradeSections.length - 1 ? <Separator className="mt-8" /> : null}
        </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

