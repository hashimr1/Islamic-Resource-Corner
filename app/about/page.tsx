import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About | Islamic Resource Corner',
  description: 'Learn about our mission, founder, and guiding inspiration.',
}

export default function AboutPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">About Islamic Resource Corner</h1>
        </header>

        <section className="bg-brand-green/5 border border-brand-green/10 border-l-4 border-l-brand-green rounded-lg p-6 sm:p-8 shadow-sm">
          <p className="text-lg leading-relaxed text-foreground">
            <span className="italic">
              Imām aṣ-Ṣādiq (ʿa) said: One who gains knowledge for the sake of Allah, acts upon it for the sake of Allah, and teaches it for the sake of Allah, is deemed great in the heavenly realm, and it is exclaimed about them ‘Indeed they gain knowledge for Allah, act for Allah, and teach for Allah!
            </span>
            <span className="block mt-4 not-italic font-semibold text-brand-green">
              Mīzān al-Ḥikmah, Ḥadīth #2224.
            </span>
          </p>
        </section>

        <section className="space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>Salāmun ʿalaykum,</p>

          <p>
            The mission for Al-Kisa Foundation is to nurture the holistic growth of individuals, families, and communities by creating infrastructure, open source resources and services in pursuit of and following the teachings of the Noble Qurʾān and Ahlul Bayt (ʿa). Our aim is to be a service to individuals, families, educators, and communities, with a focus on delivering the Islamic truth and reaching people in many places.
          </p>

          <p>
            While we have been creating resources through Kisa Publications, Kisa Family, and other entities, the goal of Islamic Resource Corner, a service of Al-Kisa Foundation, is to create a central and more accessible location for Islamic resources, in particular educational resources, for the benefit of teachers, students, educators, parents, knowledge-seekers, and sharers.
          </p>

          <p>
            Alḥamdulillāh with the tawfīq from Allah (swt), and the Ahlul Bayt (ʿa), we are humbled to share this open source, online, platform to collaborate with others.
          </p>

          <p>
            This platform was requested by the community, which led us to embark on a journey that took over two years, and we still have further improvements in mind, inshāʾAllāh.
          </p>

          <p>
            We hope that this platform will be used by several contributors who can upload their own resources for others to share and benefit from. In this way, this open source platform will grow organically.
          </p>

          <p>
            We urge you all to please{' '}
            <Link href="/auth/signup" className="text-primary font-semibold underline-offset-4 hover:underline">
              sign up as contributors
            </Link>{' '}
            and upload your resources so we can grow together. To sign up as a contributor, all you need to do is create an account, and upload your resource. Islamic Resource Corner has a mission team that will assist and review for authenticity and then your resource will appear live on the website for others to download.
          </p>

          <p>
            We pray that this is a useful platform for the community at large, and look forward to hearing any feedback, both positive and constructive, for us to incorporate more features and enhance further. Please share your feedback to{' '}
            <a href="mailto:info@islamicresourcecorner.com" className="text-primary font-semibold underline-offset-4 hover:underline">
              info@islamicresourcecorner.com
            </a>{' '}
            or use the{' '}
            <Link href="/contact" className="text-primary font-semibold underline-offset-4 hover:underline">
              feedback form
            </Link>
            . We appreciate your feedback!
          </p>

          <p>We pray to Allah to give us the strength and tawfīq to perform our duties and responsibilities.</p>

          <p>With Duʿās,</p>

          <p className="font-semibold text-foreground">Nabi R. Mir (Abidi)</p>
        </section>
      </div>
    </main>
  )
}

