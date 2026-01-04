import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Download, DownloadCloud, Edit3, ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { formatFileSize } from '@/lib/utils'
import { DownloadButton } from './download-button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ResourcePage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient()
  const userData = (await getCurrentUser()) as any

  // Try to find resource by slug
  let query = supabase
    .from('resources')
    .select(
      `
        id,
        title,
        slug,
        description,
        short_description,
        file_url,
        file_type,
        file_size,
        attachments,
        external_links,
        preview_image_url,
        downloads,
        created_at,
        status,
        user_id,
        target_grades,
        resource_types,
        topics_languages,
        topics_quran,
        topics_duas_ziyarat,
        topics_aqaid,
        topics_fiqh,
        topics_akhlaq,
        topics_tarikh,
        topics_personalities,
        topics_islamic_months,
        topics_other,
        credit_organization,
        credit_other,
        credits,
        profiles:user_id (
          id,
          email,
          username,
          full_name,
          first_name,
          last_name
        )
      `
    )
    .eq('slug', params.slug)

  let { data: resource, error } = (await query.single()) as { data: any; error: any }

  // If not found by slug, and param looks like a UUID, try finding by ID
  // This supports legacy links
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug)

  if ((error || !resource) && isUuid) {
    const idQuery = supabase
      .from('resources')
      .select(
        `
          id,
          title,
          slug,
          description,
          short_description,
          file_url,
          file_type,
          file_size,
          attachments,
          external_links,
          preview_image_url,
          downloads,
          created_at,
          status,
          user_id,
          target_grades,
          resource_types,
          topics_languages,
          topics_quran,
          topics_duas_ziyarat,
          topics_aqaid,
          topics_fiqh,
          topics_akhlaq,
          topics_tarikh,
          topics_personalities,
          topics_islamic_months,
          topics_other,
          credit_organization,
          credit_other,
          credits,
          profiles:user_id (
            id,
            email,
            username,
            full_name,
            first_name,
            last_name
          )
        `
      )
      .eq('id', params.slug)

    const result = await idQuery.single()
    resource = result.data
    error = result.error
  }

  if (error || !resource) {
    console.error('Resource not found', error)
    notFound()
  }

  const isOwner = userData?.user?.id === resource.user_id
  const isAdmin = userData?.profile?.role === 'admin'
  const isApproved = resource.status === 'approved'

  // Access rules:
  // - Approved resources: public
  // - Pending/rejected: only uploader or admin
  if (!isApproved && !(isOwner || isAdmin)) {
    notFound()
  }

  const uploaderName =
    resource.profiles?.full_name ||
    (resource.profiles?.first_name && resource.profiles?.last_name
      ? `${resource.profiles.first_name} ${resource.profiles.last_name}`
      : null) ||
    resource.profiles?.username ||
    resource.profiles?.email ||
    'Unknown contributor'

  const attachments = resource.attachments || []
  const externalLinks = resource.external_links || []
  const legacyAttachments =
    (!attachments || attachments.length === 0) && resource.file_url
      ? [
        {
          id: 'legacy-file',
          name: resource.file_url?.split('/')?.pop?.() || 'Resource file',
          url: resource.file_url,
          size: resource.file_size,
          type: resource.file_type,
        },
      ]
      : []

  const allAttachments = attachments?.length ? attachments : legacyAttachments
  const primaryAttachment = allAttachments[0]
  const primaryAttachmentSize =
    typeof primaryAttachment?.size === 'number'
      ? primaryAttachment.size
      : primaryAttachment?.size
        ? Number(primaryAttachment.size)
        : null

  const grades = resource.target_grades ?? []
  const subjects = resource.subjects ?? []
  const resourceTypes = resource.resource_types ?? []
  const languages = resource.topics_languages ?? []

  const topicsByGroup = [
    { label: 'Quran', items: resource.topics_quran },
    { label: 'Du\'as & Ziyarats', items: resource.topics_duas_ziyarat },
    { label: 'Aqaid', items: resource.topics_aqaid },
    { label: 'Fiqh', items: resource.topics_fiqh },
    { label: 'Akhlaq', items: resource.topics_akhlaq },
    { label: 'Tarikh', items: resource.topics_tarikh },
    { label: 'Personalities', items: resource.topics_personalities },
    { label: 'Islamic Months', items: resource.topics_islamic_months },
    { label: 'Languages', items: resource.topics_languages },
    { label: 'Other Topics', items: resource.topics_other },
  ]

  const credit =
    resource.credit_other || resource.credit_organization || resource.credits || 'Not provided'

  const primaryCategory =
    resourceTypes?.[0] || subjects?.[0] || grades?.[0] || languages?.[0] || 'Resource'

  // Related resources (simple heuristic: same primary type if available)
  const relatedQuery = supabase
    .from('resources')
    .select('id, title, short_description, preview_image_url')
    .eq('status', 'approved')
    .neq('id', resource.id)
    .limit(4)

  const relatedResourcesResponse = primaryCategory
    ? await relatedQuery.contains('resource_types', [primaryCategory])
    : await relatedQuery

  const relatedResources = relatedResourcesResponse.data || []

  const fileInfo =
    primaryAttachment?.type || primaryAttachmentSize
      ? [
        primaryAttachment?.type?.toUpperCase(),
        primaryAttachmentSize ? formatFileSize(primaryAttachmentSize) : null,
      ]
        .filter(Boolean)
        .join(' • ')
      : null

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Top Header Section */}
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/browse">Browse</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/browse?category=${encodeURIComponent(primaryCategory)}`}>
                  {primaryCategory}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{resource.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {!isApproved && isAdmin && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              Status: {resource.status === 'pending' ? 'Pending' : 'Rejected'}
            </Badge>
          )}

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-brand-green-dark">
              {resource.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-brand-green/10 text-brand-green-dark font-semibold">
                    {(uploaderName || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium">{uploaderName}</span>
              </div>
              <span className="hidden sm:inline-block text-border">•</span>
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline">Uploaded on</span> {format(new Date(resource.created_at), 'PPP')}
              </div>
              <span className="hidden sm:inline-block text-border">•</span>
              <div className="flex items-center gap-1.5">
                <DownloadCloud className="h-4 w-4" />
                <span>{resource.downloads ?? 0} downloads</span>
              </div>
              {isApproved && isAdmin && (
                <Badge className="bg-green-600 text-white hover:bg-green-700 ml-auto sm:ml-0">Approved</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-12">

          {/* Left Column: Preview & Actions (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-border/50">
              <div className="aspect-[3/4] w-full bg-white flex items-center justify-center relative p-4">
                {resource.preview_image_url ? (
                  <img
                    src={resource.preview_image_url}
                    alt={`${resource.title} preview`}
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                    <span className="text-6xl opacity-20">🖼️</span>
                    <span className="text-sm font-medium">No preview</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="border-0 shadow-md ring-1 ring-border/50">
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <h3 className="font-header font-semibold text-lg text-brand-green-dark flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Downloads
                  </h3>
                  {allAttachments.length ? (
                    <div className="space-y-3">
                      {allAttachments.map((attachment: any) => (
                        <DownloadButton
                          key={attachment.id || attachment.url}
                          resourceId={resource.id}
                          attachment={{
                            name: attachment.name || 'Attachment',
                            url: attachment.url,
                            size: attachment.size,
                            type: attachment.type,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No files available for download.</p>
                  )}

                  {fileInfo && (
                    <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                      <span>Format</span>
                      <span className="font-medium text-foreground">{fileInfo}</span>
                    </div>
                  )}
                </div>

                {externalLinks?.length ? (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-brand-green-dark">External Resources</h4>
                    <div className="space-y-2">
                      {externalLinks.map((link: any, index: number) => (
                        <a
                          key={link.url || index}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2.5 text-sm transition hover:bg-muted hover:border-brand-green/30 hover:shadow-sm group"
                        >
                          <div className="space-y-0.5 overflow-hidden">
                            <p className="font-medium truncate group-hover:text-brand-green-dark">{link.title || 'External link'}</p>
                            <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-brand-green" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isAdmin && (
                  <Button asChild variant="outline" className="w-full mt-4" size="sm">
                    <Link href={`/dashboard/upload?edit=${resource.id}`}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Resource
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm ring-1 ring-border/50 lg:hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">License &amp; Copyright</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">Credit To: </span>
                  <span className="text-foreground">{credit}</span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Please respect copyright and use this resource only for educational or permitted purposes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Details (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">

            <section className="space-y-4">
              <h3 className="text-xl font-header font-bold text-brand-green-dark border-l-4 border-brand-yellow pl-3">Overview</h3>
              <Card className="border-0 shadow-sm bg-white/50">
                <CardContent className="pt-6 prose prose-slate max-w-none">
                  {resource.description ? (
                    <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{resource.description}</div>
                  ) : resource.short_description ? (
                    <p className="leading-relaxed text-foreground/90">{resource.short_description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No description provided.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-header font-bold text-brand-green-dark border-l-4 border-brand-yellow pl-3">Details</h3>
              <Card className="border-0 shadow-sm bg-white/50">
                <CardContent className="pt-6 grid gap-6 sm:grid-cols-2">
                  {[
                    { label: 'Grades', items: grades },
                    { label: 'Subjects', items: subjects },
                    { label: 'Resource Types', items: resourceTypes },
                    { label: 'Languages', items: languages },
                  ].map(detail => (
                    <div key={detail.label} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{detail.label}</p>
                      {detail.items?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {detail.items.map((value: string) => (
                            <Badge key={value} variant="secondary" className="capitalize bg-brand-green/5 hover:bg-brand-green/10 text-brand-green-dark border-brand-green/10">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Not specified</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-header font-bold text-brand-green-dark border-l-4 border-brand-yellow pl-3">Topics</h3>
              <Card className="border-0 shadow-sm bg-white/50">
                <CardContent className="pt-6">
                  {topicsByGroup.some(group => group.items?.length) ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {topicsByGroup
                        .filter(group => group.items?.length)
                        .map(group => (
                          <div key={group.label} className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {group.label}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {group.items?.map((topic: string) => (
                                <Badge key={topic} variant="outline" className="capitalize text-slate-600 border-slate-200">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No topics provided.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <Card className="border-0 shadow-sm ring-1 ring-border/50 hidden lg:block">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-medium">License &amp; Copyright</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">Credit To: </span>
                  <span className="text-foreground">{credit}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Please respect copyright and use this resource only for educational or permitted
                  purposes. If you reuse or remix the content, keep the original attribution intact.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>

        <Separator className="my-8" />

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-header font-bold text-brand-green-dark">Discover More Resources</h2>
            <Link href="/browse" className="text-sm font-semibold text-brand-yellow-hover hover:text-brand-yellow transition-colors">
              Browse all &rarr;
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedResources.length > 0
              ? relatedResources.map((item: any) => (
                <Card key={item.id} className="h-full flex flex-col group hover:shadow-lg transition-all duration-300 border-0 shadow ring-1 ring-border/50 overflow-hidden">
                  {item.preview_image_url ? (
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={item.preview_image_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] w-full bg-brand-green/5 flex items-center justify-center">
                      <span className="text-brand-green/20 text-4xl">📚</span>
                    </div>
                  )}
                  <CardContent className="flex-1 p-4 flex flex-col space-y-3">
                    <h3 className="font-semibold line-clamp-2 group-hover:text-brand-green-dark transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {item.short_description || 'A helpful resource you may find useful.'}
                    </p>
                    <Button asChild variant="secondary" size="sm" className="w-full mt-auto bg-brand-green/10 text-brand-green-dark hover:bg-brand-green hover:text-white transition-colors">
                      <Link href={`/resource/${item.id}`}>View Resource</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
              : [...Array(4)].map((_, idx) => (
                <Card key={idx} className="h-full flex flex-col animate-pulse border-0 shadow">
                  <div className="h-40 w-full bg-muted" />
                  <CardContent className="flex-1 p-4 space-y-4">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}

