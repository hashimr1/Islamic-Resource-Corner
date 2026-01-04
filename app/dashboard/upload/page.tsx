import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import UploadFormClient from './upload-form-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UploadPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
  const supabase = createSupabaseServerClient()
  const userData = (await getCurrentUser()) as any

  if (!userData) {
    redirect('/auth/login')
  }

  let initialData: any = null

  if (searchParams?.edit) {
    const { data, error } = await supabase
      .from('resources')
      .select(
        `
          id,
          user_id,
          title,
          short_description,
          description,
          file_url,
          file_size,
          file_type,
          attachments,
          external_links,
          preview_image_url,
          additional_images,
          target_grades,
          resource_types,
          topics_curriculum,
          topics_quran,
          topics_duas_ziyarat,
          topics_aqaid,
          topics_fiqh,
          topics_akhlaq,
          topics_tarikh,
          topics_personalities,
          topics_islamic_months,
          topics_languages,
          topics_other,
          credit_organization,
          credit_other,
          copyright_verified
        `
      )
      .eq('id', searchParams.edit)
      .single()

    if (error || !data) {
      redirect('/dashboard')
    }

    const isOwner = userData?.user?.id === data.user_id
    const isAdmin = userData?.profile?.role === 'admin'
    if (!isOwner && !isAdmin) {
      redirect('/dashboard')
    }

    initialData = data
  }

  return <UploadFormClient initialData={initialData} />
}

