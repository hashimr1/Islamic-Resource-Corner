'use server'

export type ContactFormData = {
  name: string
  email: string
  subject?: string
  message: string
}

/**
 * TODO: Wire up to an email provider (e.g., Resend/SMTP).
 * For now we just log submissions and return a success flag.
 */
export async function sendContactEmail(formData: ContactFormData) {
  if (!formData?.name || !formData?.email || !formData?.message) {
    return { success: false, error: 'Missing required fields' }
  }

  console.log('Contact form submission received:', formData)

  return { success: true }
}

