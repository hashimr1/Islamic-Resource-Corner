'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: {
  firstName: string
  lastName: string
  username: string
  country: string
  occupation: string
}) {
  const supabase = createSupabaseServerClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if username is already taken by another user
  if (formData.username) {
    const { data: existingUsername } = (await supabase
      .from('profiles')
      .select('username, id')
      .eq('username', formData.username)
      .single()) as { data: any; error: any }

    if (existingUsername && existingUsername.id !== user.id) {
      return { error: 'Username is already taken by another user' }
    }
  }

  // Update profile
  const profileData = {
    first_name: formData.firstName,
    last_name: formData.lastName,
    username: formData.username,
    country: formData.country,
    occupation: formData.occupation,
    full_name: `${formData.firstName} ${formData.lastName}`,
  }

  const { error } = (await (supabase.from('profiles') as any)
    .update(profileData)
    .eq('id', user.id)) as { error: any }

  if (error) {
    console.error('Profile update error:', error)
    return { error: error.message }
  }

  // Revalidate relevant paths
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')

  return { success: true }
}

export async function updatePassword(formData: {
  newPassword: string
  confirmPassword: string
}) {
  const supabase = createSupabaseServerClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate passwords match
  if (formData.newPassword !== formData.confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  // Validate password length
  if (formData.newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: formData.newPassword
  })

  if (error) {
    console.error('Password update error:', error)
    return { error: error.message }
  }

  return { success: true, message: 'Password updated successfully' }
}

export async function getProfile() {
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

