import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/client'

/**
 * API Route: Create a new resource with refined categorization
 * POST /api/upload/resource-refined
 * Body: JSON with comprehensive resource data
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              secure: process.env.NODE_ENV === 'production',
            })
          } catch {
            // Ignore cookie setting errors in route handlers
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              secure: process.env.NODE_ENV === 'production',
            })
          } catch {
            // Ignore cookie removal errors in route handlers
          }
        },
      },
    }
  )

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be logged in to upload resources.' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }

    if (!body.shortDescription || body.shortDescription.trim().length === 0) {
      return NextResponse.json({ error: 'Short description is required.' }, { status: 400 })
    }

    const attachmentsInput = Array.isArray(body.attachments) ? body.attachments : []
    const normalizedAttachments =
      attachmentsInput
        .filter((att: any) => att?.url)
        .map((att: any) => ({
          id:
            att.id ||
            (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `att-${Date.now()}-${Math.random().toString(16).slice(2)}`),
          name: att.name || att.url?.split('/')?.pop?.() || 'Attachment',
          url: att.url,
          size: att.size ?? '',
          type: att.type ?? '',
        })) || []

    const legacyAttachment =
      normalizedAttachments.length === 0 && body.fileUrl
        ? [
            {
              id: 'legacy-file',
              name: body.fileUrl?.split('/')?.pop?.() || 'Resource file',
              url: body.fileUrl,
              size: body.fileSize ? String(body.fileSize) : '',
              type: body.fileType || '',
            },
          ]
        : []

    const attachments = normalizedAttachments.length ? normalizedAttachments : legacyAttachment

    const externalLinks =
      Array.isArray(body.externalLinks) && body.externalLinks.length
        ? body.externalLinks
            .filter((link: any) => link?.title && link?.url)
            .map((link: any) => ({
              title: String(link.title).trim(),
              url: String(link.url).trim(),
            }))
        : []
    const topicsCurriculum = Array.isArray(body.topicsCurriculum) ? body.topicsCurriculum : []

    if (!body.previewImageUrl) {
      return NextResponse.json({ error: 'Featured image is required.' }, { status: 400 })
    }

    if (!body.copyrightVerified) {
      return NextResponse.json(
        { error: 'You must certify that you have the right to distribute this content.' },
        { status: 400 }
      )
    }

    // Ensure at least one categorization field is filled
    const hasGrades = body.targetGrades && body.targetGrades.length > 0
    const hasResourceTypes = body.resourceTypes && body.resourceTypes.length > 0

    if (!hasGrades || !hasResourceTypes) {
      return NextResponse.json(
        { error: 'Please select at least one grade level and one resource type.' },
        { status: 400 }
      )
    }

    const hasFiles = attachments.length > 0
    const hasLinks = externalLinks.length > 0

    if (!hasFiles && !hasLinks) {
      return NextResponse.json(
        { error: 'Add at least one file upload or one external link.' },
        { status: 400 }
      )
    }

    const primaryAttachment = attachments[0]

    // Insert resource into database
    const resourceData = {
      user_id: user.id,
      title: body.title.trim(),
      short_description: body.shortDescription.trim(),
      // Allow empty description; store empty string if not provided
      description: (body.detailedDescription ?? '').trim(),
      file_url: primaryAttachment?.url || null,
      file_size: primaryAttachment?.size ? Number(primaryAttachment.size) || null : null,
      file_type: primaryAttachment?.type || null,
      attachments,
      external_links: externalLinks,
      preview_image_url: body.previewImageUrl,
      additional_images: body.additionalImages || [],
      // Required categorization
      target_grades: body.targetGrades || [],
      resource_types: body.resourceTypes || [],
      // Optional topic tags
      topics_quran: body.topicsQuran || [],
      topics_duas_ziyarat: body.topicsDuasZiyarat || [],
      topics_aqaid: body.topicsAqaid || [],
      topics_fiqh: body.topicsFiqh || [],
      topics_akhlaq: body.topicsAkhlaq || [],
      topics_tarikh: body.topicsTarikh || [],
      topics_personalities: body.topicsPersonalities || [],
      topics_islamic_months: body.topicsIslamicMonths || [],
      topics_languages: body.topicsLanguages || [],
      topics_curriculum: topicsCurriculum,
      topics_other: body.topicsOther || [],
      // Credits
      credit_organization: body.creditOrganization || null,
      credit_other: body.creditOther || null,
      copyright_verified: body.copyrightVerified,
      // Default values
      status: 'pending' as const,
      downloads: 0,
    }

    const { data: resource, error: insertError } = (await supabase
      .from('resources')
      .insert(resourceData as any) // Type assertion needed until Supabase regenerates types
      .select()
      .single()) as { data: any; error: any }

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create resource. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Resource created successfully:', resource.id)

    return NextResponse.json({
      success: true,
      resourceId: resource.id,
      resource,
    })
  } catch (error) {
    console.error('Create resource exception:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

