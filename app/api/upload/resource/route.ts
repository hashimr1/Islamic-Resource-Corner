import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/client'

/**
 * API Route: Create a new resource in the database
 * POST /api/upload/resource
 * Body: JSON with resource data
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

    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json({ error: 'Detailed description is required.' }, { status: 400 })
    }

    if (!body.fileUrl) {
      return NextResponse.json({ error: 'Resource file is required.' }, { status: 400 })
    }

    if (!body.copyrightVerified) {
      return NextResponse.json(
        { error: 'You must verify that you have the right to distribute this content.' },
        { status: 400 }
      )
    }

    // Ensure at least one categorization field is filled
    const hasCategorization =
      (body.grades && body.grades.length > 0) ||
      (body.subjects && body.subjects.length > 0) ||
      (body.resourceTypes && body.resourceTypes.length > 0) ||
      (body.topicsIslamic && body.topicsIslamic.length > 0) ||
      (body.topicsGeneral && body.topicsGeneral.length > 0)

    if (!hasCategorization) {
      return NextResponse.json(
        { error: 'Please select at least one category (grade, subject, type, or topic).' },
        { status: 400 }
      )
    }

    // Insert resource into database
    // Generate unique slug
    const slugBase = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    let slug = slugBase
    let slugExists = true
    let slugCounter = 0

    while (slugExists) {
      if (slugCounter > 0) {
        slug = `${slugBase}-${slugCounter}`
      }
      const { data: existingSlug } = await supabase
        .from('resources')
        .select('slug')
        .eq('slug', slug)
        .single()

      if (!existingSlug) {
        slugExists = false
      } else {
        slugCounter++
      }
    }

    // Insert resource into database
    const resourceData = {
      user_id: user.id,
      title: body.title.trim(),
      slug,
      short_description: body.shortDescription?.trim() || null,
      description: body.description.trim(),
      file_url: body.fileUrl,
      file_size: body.fileSize || null,
      file_type: body.fileType || null,
      preview_image_url: body.previewImageUrl || null,
      grades: body.grades || [],
      subjects: body.subjects || [],
      resource_types: body.resourceTypes || [],
      topics_islamic: body.topicsIslamic || [],
      topics_general: body.topicsGeneral || [],
      credits: body.credits?.trim() || null,
      copyright_verified: body.copyrightVerified,
      // Default values
      category: body.subjects?.[0] || 'Other', // Fallback for old schema compatibility
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

