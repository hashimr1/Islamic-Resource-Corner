'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Increment the download count for a resource and return its file URL.
 * SQL intention: UPDATE resources SET downloads = downloads + 1 WHERE id = $1;
 */
export async function incrementDownload(resourceId: string) {
  if (!resourceId) {
    return { error: 'Missing resource id' }
  }

  const supabase = createSupabaseServerClient() as unknown as SupabaseClient<Database>

  const { data: resource, error: fetchError } = await supabase
    .from('resources')
    .select('downloads, slug')
    .eq('id', resourceId)
    .single()

  if (fetchError || !resource) {
    console.error('Failed to load resource for download', fetchError)
    return { error: 'Resource not found' }
  }

  const { error: updateError } = await supabase
    .from('resources')
    .update({
      downloads: (resource.downloads ?? 0) + 1,
    })
    .eq('id', resourceId)

  if (updateError) {
    console.error('Failed to increment downloads', updateError)
    return { error: 'Could not increment downloads' }
  }

  // Revalidate both ID and Slug paths to be safe
  revalidatePath(`/resource/${resourceId}`)
  if (resource.slug) {
    revalidatePath(`/resource/${resource.slug}`)
  }
  revalidatePath('/dashboard')

  return { success: true }
}

