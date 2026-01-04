'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: any; error: any }

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  return { supabase, user }
}

export async function approveResource(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) throw new Error('Missing resource id')

  const { supabase, error } = await requireAdmin()
  if (!supabase || error) throw new Error(error || 'Unauthorized')

  const resources = supabase.from('resources' as any) as any
  const { error: updateError } = await resources.update({ status: 'approved' }).eq('id', id)

  if (updateError) {
    throw new Error('Failed to approve resource')
  }

  revalidatePath('/admin')
}

export async function rejectResource(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) throw new Error('Missing resource id')

  const { supabase, error } = await requireAdmin()
  if (!supabase || error) throw new Error(error || 'Unauthorized')

  const resources = supabase.from('resources' as any) as any
  const { error: updateError } = await resources.update({ status: 'rejected' }).eq('id', id)

  if (updateError) {
    throw new Error('Failed to reject resource')
  }

  revalidatePath('/admin')
}

export async function updateListOrder(items: { id: string; display_order: number }[]): Promise<void> {
  if (!Array.isArray(items)) {
    throw new Error('Invalid payload')
  }

  const { supabase, error } = await requireAdmin()
  if (!supabase || error) {
    throw new Error(error || 'Unauthorized')
  }

  const featuredLists = supabase.from('home_featured_lists' as any) as any
  const updates = items.map((item, index) => featuredLists.update({ display_order: index }).eq('id', item.id))

  const results = await Promise.all(updates)
  const failed = results.find(result => result.error)
  if (failed && failed.error) {
    console.error('Failed to update list order', failed.error)
    throw new Error('Failed to update list order')
  }

  revalidatePath('/')
  revalidatePath('/admin')
}

export async function deleteFeaturedList(id: string): Promise<void> {
  if (!id) throw new Error('Missing list id')

  const { supabase, error } = await requireAdmin()
  if (!supabase || error) {
    throw new Error(error || 'Unauthorized')
  }

  const { error: deleteError } = await supabase.from('home_featured_lists').delete().eq('id', id)
  if (deleteError) {
    console.error('Failed to delete featured list', deleteError)
    throw new Error('Failed to delete featured list')
  }

  revalidatePath('/')
  revalidatePath('/admin')
}

