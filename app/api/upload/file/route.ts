import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/client'

/**
 * API Route: Upload a file to Supabase Storage
 * POST /api/upload/file
 * Body: FormData with 'file' and 'bucket' fields
 */
async function uploadWithRetry(
  supabase: ReturnType<typeof createServerClient<Database>>,
  bucket: 'resource-files' | 'resource-thumbnails',
  path: string,
  buffer: Uint8Array,
  contentType: string,
  attempts = 3
) {
  let lastError: any = null
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      })

    if (!error) return { data }
    lastError = error
    // Small backoff on retry
    await new Promise(res => setTimeout(res, 150 * (i + 1)))
  }
  return { error: lastError }
}

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
    return NextResponse.json({ error: 'You must be logged in to upload files.' }, { status: 401 })
  }

  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as 'resource-files' | 'resource-thumbnails'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!bucket || !['resource-files', 'resource-thumbnails'].includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket name' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload file to Supabase Storage with retry (handles transient EPIPE/fetch failed)
    const { data, error: uploadError } = await uploadWithRetry(
      supabase,
      bucket,
      fileName,
      buffer,
      file.type
    )

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    console.log(`File uploaded successfully: ${bucket}/${fileName}`)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error('File upload exception:', error)
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    )
  }
}

