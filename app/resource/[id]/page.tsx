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

export default async function ResourcePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const userData = (await getCurrentUser()) as any

  const { data: resource, error } = (await supabase
    .from('resources')
    .select(
      `
        id,
        title,
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
    .eq('id', params.id)
    .single()) as { data: any; error: any }

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
    .neq('id', params.id)
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
    <div className="bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
          <Breadcrumb className="mb-2">
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
                <BreadcrumbPage>{resource.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {!isApproved && isAdmin && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
              Status: {resource.status === 'pending' ? 'Pending' : 'Rejected'}
            </Badge>
          )}

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              <Card className="overflow-hidden rounded-lg shadow-md bg-muted">
                <div className="aspect-[3/4] w-full bg-muted flex items-center justify-center">
                  {resource.preview_image_url ? (
                    <img
                      src={resource.preview_image_url}
                      alt={`${resource.title} preview`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-muted-foreground">No preview image available</div>
                  )}
                </div>
              </Card>

              <Card>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
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
                      <p className="text-sm text-muted-foreground">No files available for download.</p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DownloadCloud className="h-4 w-4" />
                      <span>{resource.downloads ?? 0} total downloads</span>
                    </div>
                    {fileInfo && (
                      <div className="text-sm text-muted-foreground">File: {fileInfo}</div>
                    )}
                  </div>

                  {externalLinks?.length ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">External Resources</h4>
                      <div className="space-y-2">
                        {externalLinks.map((link: any, index: number) => (
                          <a
                            key={link.url || index}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm transition hover:bg-muted/60"
                          >
                            <div className="space-y-0.5">
                              <p className="font-medium">{link.title || 'External link'}</p>
                              <p className="text-xs text-muted-foreground break-all">{link.url}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {isAdmin && (
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link href={`/dashboard/upload?edit=${resource.id}`}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Resource
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                  {isApproved && isAdmin && (
                    <Badge className="bg-green-600 text-white hover:bg-green-700">Approved</Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>{resource.downloads ?? 0} downloads</span>
                  </div>
                  <span>•</span>
                  <span>{format(new Date(resource.created_at), 'PPP')}</span>
                </div>

                <h1 className="text-4xl font-bold leading-tight tracking-tight">{resource.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="uppercase text-xs font-semibold text-primary">Author</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{(uploaderName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Link href="#" className="font-medium text-foreground hover:underline">
                      {uploaderName}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <section className="space-y-3">
                  <h3 className="text-xl font-semibold">Overview</h3>
                  <Card>
                    <CardContent className="pt-4 prose prose-sm max-w-none text-foreground">
                      {resource.description ? (
                        <div className="whitespace-pre-wrap leading-7">{resource.description}</div>
                      ) : resource.short_description ? (
                        <p className="leading-7">{resource.short_description}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                </section>

                <Separator className="my-6" />

                <section className="space-y-3">
                  <h3 className="text-xl font-semibold">Resource Details</h3>
                  <Card>
                    <CardContent className="pt-4 grid gap-4 sm:grid-cols-2">
                      {[
                        { label: 'Grades', items: grades },
                        { label: 'Subjects', items: subjects },
                        { label: 'Resource Types', items: resourceTypes },
                        { label: 'Languages', items: languages },
                      ].map(detail => (
                        <div key={detail.label} className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">{detail.label}</p>
                          {detail.items?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {detail.items.map((value: string) => (
                                <Badge key={value} variant="outline" className="capitalize">
                                  {value}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Not specified</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </section>

                <Separator className="my-6" />

                <section className="space-y-3">
                  <h3 className="text-xl font-semibold">Topics</h3>
                  <Card>
                    <CardContent className="pt-4">
                      {topicsByGroup.some(group => group.items?.length) ? (
                        <div className="space-y-4">
                          {topicsByGroup
                            .filter(group => group.items?.length)
                            .map(group => (
                              <div key={group.label} className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  {group.label}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {group.items?.map((topic: string) => (
                                    <Badge key={topic} variant="outline" className="capitalize">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No topics provided.</p>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>License &amp; Copyright</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    <span className="font-semibold">Credit To: </span>
                    {credit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please respect copyright and use this resource only for educational or permitted
                    purposes. If you reuse or remix the content, keep the original attribution intact.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Discover More Resources</h2>
              <Link href="/browse" className="text-sm text-primary hover:underline">
                Browse all
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedResources.length > 0
                ? relatedResources.map((item: any) => (
                    <Card key={item.id} className="h-full flex flex-col">
                      {item.preview_image_url && (
                        <div className="h-40 w-full overflow-hidden">
                          <img
                            src={item.preview_image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="flex-1 p-4 space-y-2">
                        <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {item.short_description || 'A helpful resource you may find useful.'}
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-2">
                          <Link href={`/resource/${item.id}`}>View Resource</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                : [...Array(4)].map((_, idx) => (
                    <Card key={idx} className="h-full flex flex-col animate-pulse">
                      <div className="h-40 w-full bg-muted" />
                      <CardContent className="flex-1 p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
            </div>
          </section>
        </div>
    </div>
  )
}

