'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function deleteResource(id: string): Promise<void> {
  if (!id) {
    throw new Error('Resource ID is required.')
  }

  const supabase = createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('You must be logged in to delete resources.')
  }

  const { data: resource, error: fetchError } = await supabase
    .from('resources')
    .select('id, user_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !resource) {
    throw new Error('Resource not found.')
  }

  if (resource.user_id !== user.id) {
    throw new Error('You can only delete your own resources.')
  }

  if (!['pending', 'rejected'].includes(resource.status)) {
    throw new Error('Approved resources cannot be deleted directly.')
  }

  const { error: deleteError } = await supabase.from('resources').delete().eq('id', id)

  if (deleteError) {
    console.error('Error deleting resource:', deleteError)
    throw new Error('Failed to delete resource.')
  }

  revalidatePath('/dashboard')
}

