import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/dashboard', label: 'Dashboard' },
]

const moreLinks = [
  { href: 'https://alkisafoundation.org/', label: 'Al-Kisa Foundation' },
  { href: 'https://www.kisafamily.org/', label: 'Kisa Family' },
  { href: 'https://kisatherapyclinic.org/', label: 'Kisa Therapy Clinic' },
  { href: 'https://www.salamonline.education/', label: 'Salam Online' },
  { href: 'https://riseschools.education/', label: 'RISE Education System' },
  { href: 'https://www.islamicbeliefs.com/', label: 'Islamic Beliefs' },
  { href: 'https://www.absanetwork.com/', label: 'ABSA Network' },
  { href: 'https://islamicresourcecorner.com/wp-content/uploads/2025/08/Annual-Report-2024-25-.pdf', label: 'Annual Report' },
]

import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer className="bg-brand-green text-white font-body">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 text-center md:text-left">
          <div className="flex items-start justify-center md:justify-start">
            <Image
              src="/images/logo-white.svg"
              alt="Islamic Resource Corner logo"
              width={250}
              height={100}
              className="h-auto w-[150px] md:w-[250px]"
              priority
            />
          </div>

          <div>
            <h3 className="text-base font-header font-bold uppercase tracking-wide text-white/90">Navigate</h3>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-body transition-colors hover:text-brand-yellow"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-header font-bold uppercase tracking-wide text-white/90">More from Al-Kisa</h3>
            <ul className="mt-4 space-y-3">
              {moreLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm font-body transition-colors hover:text-brand-yellow"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4 items-center md:items-start">
            <Button asChild size="sm" className="w-fit bg-brand-yellow hover:bg-[#d4b619] text-white">
              <a
                href="https://alkisafoundation.org/donate/"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Heart className="h-4 w-4 mr-2" />
                Donate
              </a>
            </Button>

            <div className="space-y-2">
              <p className="text-sm font-header font-bold uppercase tracking-wide text-white/90">Contact Us</p>
              <a
                href="mailto:info@islamicresourcecorner.com"
                className="text-sm font-body transition-colors hover:text-brand-yellow"
              >
                info@islamicresourcecorner.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-green-dark">
        <div className="container mx-auto max-w-6xl px-6 py-4 text-center text-xs font-body text-white/80">
          Copyright © 2025 Islamic Resource Corner | A Service of Al-Kisa Foundation. All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}

