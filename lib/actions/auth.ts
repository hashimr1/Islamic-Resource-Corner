'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export async function signUp(formData: {
  email: string
  password: string
  firstName: string
  lastName: string
  username: string
  country: string
  occupation: string
}) {
  const supabase = createSupabaseServerClient()

  // Check if username is already taken
  const { data: existingUsername } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', formData.username)
    .single()

  if (existingUsername) {
    return { error: 'Username is already taken. Please choose a different one.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        country: formData.country,
        occupation: formData.occupation,
        full_name: `${formData.firstName} ${formData.lastName}`,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Revalidate the layout to pick up the new session
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'layout')
  
  // Return success - let client handle redirect
  return { success: true }
}

// Note: signIn is now handled by the route handler at /api/auth/login
// This server action is kept for backward compatibility but should not be used
export async function signIn(email: string, password: string) {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('Server Action login:', email, 'Result:', error ? error.message : 'Success')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'layout')
  
  return { success: true }
}

export async function signOut() {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

// Cache getCurrentUser to avoid multiple auth calls per request
export const getCurrentUser = cache(async () => {
  const supabase = createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = (await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()) as { data: any; error: any }

  return { user, profile }
})

export async function isAdmin() {
  const userData = (await getCurrentUser()) as any
  return userData?.profile?.role === 'admin'
}

