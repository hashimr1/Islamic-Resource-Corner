import type { Metadata } from 'next'
import { ContactForm } from './contact-form'

export const metadata: Metadata = {
  title: 'Contact Us | Islamic Resource Corner',
  description: 'Reach out with questions or share feedback to help us improve.',
}

export default function ContactPage() {
  return (
    <main className="py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              Have a question or suggestion? We&apos;d love to hear from you.
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <section className="space-y-4 rounded-lg border bg-card p-6 sm:p-8 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">General Inquiries</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Use the form below or email us directly at{' '}
                  <a
                    href="mailto:info@islamicresourcecorner.com"
                    className="text-primary font-semibold underline-offset-4 hover:underline"
                  >
                    info@islamicresourcecorner.com
                  </a>
                  .
                </p>
              </div>

              <ContactForm />
            </section>

            <section className="space-y-4 rounded-lg border bg-card p-6 sm:p-8 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Share Your Feedback</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Help us improve by sharing your thoughts directly.
                </p>
              </div>

              <div className="rounded-md overflow-hidden border bg-muted/30">
                <iframe
                  src="https://app.startinfinity.com/form/d32468d3-5e25-4824-89ff-a4bc04cb639d"
                  width="100%"
                  height="800"
                  className="w-full h-[800px] min-h-[600px]"
                  frameBorder={0}
                  allowFullScreen
                  title="Feedback Form"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
  )
}

