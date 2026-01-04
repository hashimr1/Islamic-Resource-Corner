'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type ActionState = {
  error?: string
  success?: string
}

function getSiteUrl() {
  const origin = headers().get('origin')
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    origin ||
    'http://localhost:3000'
  )
}

export async function forgotPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get('email') as string | null)?.trim()

  if (!email) {
    return { error: 'Email is required.' }
  }

  const supabase = createSupabaseServerClient()
  const redirectTo = `${getSiteUrl().replace(/\/$/, '')}/auth/callback?next=/auth/update-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: 'Check your email for the password reset link.',
  }
}

export async function updatePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState | void> {
  const password = formData.get('password') as string | null
  const confirmPassword = formData.get('confirmPassword') as string | null

  if (!password || !confirmPassword) {
    return { error: 'Please fill in all fields.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

