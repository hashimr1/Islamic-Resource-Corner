'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type AttachmentInput = {
  id: string
  name: string
  url: string
  size?: string | number
  type?: string
}

export type ExternalLinkInput = {
  title: string
  url: string
}

interface BaseResourceData {
  title: string
  shortDescription: string
  description: string
  targetGrades: string[]
  resourceTypes: string[]
  topicsQuran: string[]
  topicsDuasZiyarat: string[]
  topicsAqaid: string[]
  topicsFiqh: string[]
  topicsAkhlaq: string[]
  topicsTarikh: string[]
  topicsPersonalities: string[]
  topicsIslamicMonths: string[]
  topicsLanguages: string[]
  topicsCurriculum?: string[]
  topicsOther: string[]
  previewImageUrl?: string | null
  additionalImages: string[]
  attachments: AttachmentInput[]
  externalLinks: ExternalLinkInput[]
  creditOrganization?: string | null
  creditOther?: string | null
  copyrightVerified: boolean
  // Legacy compatibility
  fileUrl?: string
  fileSize?: number
  fileType?: string
}

// Type definition for the resource creation form data
export interface CreateResourceData extends BaseResourceData { }

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @returns The public URL of the uploaded file, or error
 */
export async function uploadFileToStorage(
  file: File,
  bucket: 'resource-files' | 'resource-thumbnails'
): Promise<{ url?: string; error?: string }> {
  const supabase = createSupabaseServerClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to upload files.' }
  }

  const userId = user.id

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { error: error.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return { url: publicUrl }
  } catch (error) {
    console.error('File upload exception:', error)
    return { error: 'Failed to upload file. Please try again.' }
  }
}

/**
 * Create a new resource in the database
 * @param formData - The resource data from the form
 * @returns Success or error message
 */
export async function createResource(formData: CreateResourceData) {
  const supabase = createSupabaseServerClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to upload resources.' }
  }

  // Validate required fields
  if (!formData.title || formData.title.trim().length === 0) {
    return { error: 'Title is required.' }
  }

  if (!formData.shortDescription || formData.shortDescription.trim().length === 0) {
    return { error: 'Short description is required.' }
  }

  if (!formData.copyrightVerified) {
    return { error: 'You must verify that you have the right to distribute this content.' }
  }

  const attachments = formData.attachments || []
  const externalLinks = formData.externalLinks || []
  const topicsCurriculum = formData.topicsCurriculum || []
  const primaryAttachment =
    attachments[0] ||
    (formData.fileUrl
      ? {
        id: 'legacy-file',
        name: formData.fileUrl.split('/').pop() || 'Resource file',
        url: formData.fileUrl,
        size: formData.fileSize ? String(formData.fileSize) : '',
        type: formData.fileType || '',
      }
      : null)

  const hasCategorization = formData.targetGrades.length > 0 && formData.resourceTypes.length > 0
  const hasFilesOrLinks = attachments.length > 0 || externalLinks.length > 0 || primaryAttachment

  if (!hasCategorization) {
    return { error: 'Please select at least one grade level and resource type.' }
  }

  if (!hasFilesOrLinks) {
    return { error: 'Add at least one file or one external link.' }
  }

  try {
    const attachmentsToSave =
      attachments.length > 0 ? attachments : primaryAttachment ? [primaryAttachment] : []

    // Generate slug
    const baseSlug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // For uniqueness check, we'll try to insert. If it fails due to unique constraint, we append random string.
    // However, a better approach for UX is to check first or handle conflict.
    // For simplicity in this iteration, we'll append a random string if it's not unique or just use a timestamp suffix if we don't want to check.
    // Actually, let's just append a short random string to ensure uniqueness always, or check.
    // Let's implement a simple check-free approach for now: slug + random suffix if collision is likely?
    // Users prefer clean slugs.
    // Let's do: slug = baseSlug. Then check if exists.

    // Better strategy for this tool call: Just create the slug field in the object.

    // Slug generation logic
    let slug = baseSlug
    const { data: existingSlug } = await supabase
      .from('resources')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    // Insert resource into database
    const resourceData = {
      user_id: user.id,
      title: formData.title.trim(),
      slug: slug,
      short_description: formData.shortDescription?.trim() || null,
      description: formData.description?.trim() || '',
      file_url: primaryAttachment?.url || null,
      file_size: primaryAttachment?.size ? Number(primaryAttachment.size) || null : null,
      file_type: primaryAttachment?.type || null,
      attachments: attachmentsToSave,
      external_links: externalLinks,
      preview_image_url: formData.previewImageUrl || null,
      additional_images: formData.additionalImages || [],
      target_grades: formData.targetGrades,
      resource_types: formData.resourceTypes,
      topics_quran: formData.topicsQuran,
      topics_duas_ziyarat: formData.topicsDuasZiyarat,
      topics_aqaid: formData.topicsAqaid,
      topics_fiqh: formData.topicsFiqh,
      topics_akhlaq: formData.topicsAkhlaq,
      topics_tarikh: formData.topicsTarikh,
      topics_personalities: formData.topicsPersonalities,
      topics_islamic_months: formData.topicsIslamicMonths,
      topics_languages: formData.topicsLanguages,
      topics_curriculum: topicsCurriculum,
      topics_other: formData.topicsOther,
      credit_organization: formData.creditOrganization || null,
      credit_other: formData.creditOther || null,
      copyright_verified: formData.copyrightVerified,
      // Default values
      status: 'pending' as const,
      downloads: 0,
    }

    const { data: resource, error: insertError } = (await supabase
      .from('resources')
      .insert(resourceData as any)
      .select()
      .single()) as { data: any; error: any }

    if (insertError) {
      console.error('Database insert error:', insertError)
      return { error: 'Failed to create resource. Please try again.' }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/browse')

    // Redirect back to dashboard so user sees their pending submission
    redirect('/dashboard')
  } catch (error) {
    console.error('Create resource exception:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export interface UpdateResourceData extends BaseResourceData {
  id: string
}

export async function updateResource(data: UpdateResourceData) {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update resources.' }
  }

  const { data: resource, error: fetchError } = await supabase
    .from('resources')
    .select('user_id')
    .eq('id', data.id)
    .single()

  if (fetchError || !resource) {
    return { error: 'Resource not found.' }
  }

  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: any; error: any }

  const isAdmin = profile?.role === 'admin'
  const isOwner = resource.user_id === user.id

  if (!isOwner && !isAdmin) {
    return { error: 'You do not have permission to update this resource.' }
  }

  const attachments = data.attachments || []
  const externalLinks = data.externalLinks || []
  const topicsCurriculum = data.topicsCurriculum || []
  const primaryAttachment =
    attachments[0] ||
    (data.fileUrl
      ? {
        url: data.fileUrl,
        size: data.fileSize ? String(data.fileSize) : '',
        type: data.fileType || '',
      }
      : null)

  if (!attachments.length && !externalLinks.length && !primaryAttachment) {
    return { error: 'Add at least one file or external link.' }
  }

  const updatePayload = {
    title: data.title,
    short_description: data.shortDescription,
    description: data.description,
    target_grades: data.targetGrades,
    resource_types: data.resourceTypes,
    topics_quran: data.topicsQuran,
    topics_duas_ziyarat: data.topicsDuasZiyarat,
    topics_aqaid: data.topicsAqaid,
    topics_fiqh: data.topicsFiqh,
    topics_akhlaq: data.topicsAkhlaq,
    topics_tarikh: data.topicsTarikh,
    topics_personalities: data.topicsPersonalities,
    topics_islamic_months: data.topicsIslamicMonths,
    topics_languages: data.topicsLanguages,
    topics_curriculum: topicsCurriculum,
    topics_other: data.topicsOther,
    preview_image_url: data.previewImageUrl || null,
    additional_images: data.additionalImages || [],
    attachments,
    external_links: externalLinks,
    file_url: primaryAttachment?.url || null,
    file_size: primaryAttachment?.size ? Number(primaryAttachment.size) || null : null,
    file_type: primaryAttachment?.type || null,
    credit_organization: data.creditOrganization || null,
    credit_other: data.creditOther || null,
    copyright_verified: data.copyrightVerified,
  }

  const { data: updatedResource, error: updateError } = await supabase
    .from('resources')
    .update(updatePayload as any)
    .eq('id', data.id)
    .select('slug')
    .single()

  if (updateError) {
    console.error('Error updating resource:', updateError)
    return { error: 'Failed to update resource.' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/resource/${data.id}`)
  if (updatedResource?.slug) {
    revalidatePath(`/resource/${updatedResource.slug}`)
  }

  return { success: true, slug: updatedResource.slug }
}

/**
 * Get all approved resources (for public browsing)
 */
export async function getApprovedResources() {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('resources')
    .select(
      `
      *,
      profiles:user_id (
        id,
        first_name,
        last_name,
        username,
        full_name
      )
    `
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching approved resources:', error)
    return []
  }

  return data || []
}

/**
 * Get resources uploaded by the current user
 */
export async function getUserResources(userId?: string) {
  const supabase = createSupabaseServerClient()

  let targetUserId = userId

  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    targetUserId = user.id
  }

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user resources:', error)
    return []
  }

  return data || []
}

/**
 * Get a single resource by ID
 */
export async function getResourceById(id: string) {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('resources')
    .select(
      `
      *,
      profiles:user_id (
        id,
        first_name,
        last_name,
        username,
        full_name
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching resource:', error)
    return null
  }

  return data
}

/**
 * Delete a resource (user can only delete their own pending/rejected resources)
 */
export async function deleteResource(resourceId: string) {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete resources.' }
  }

  // First, get the resource to check ownership and get file URLs
  const { data: resource, error: fetchError } = (await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single()) as { data: any; error: any }

  if (fetchError || !resource) {
    return { error: 'Resource not found.' }
  }

  if (resource.user_id !== user.id) {
    return { error: 'You can only delete your own resources.' }
  }

  if (resource.status === 'approved') {
    return { error: 'Cannot delete approved resources.' }
  }

  // Delete files from storage (optional - files will remain but orphaned)
  // You may want to implement cleanup logic here

  // Delete resource from database
  const { error: deleteError } = await supabase.from('resources').delete().eq('id', resourceId)

  if (deleteError) {
    console.error('Error deleting resource:', deleteError)
    return { error: 'Failed to delete resource.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
