'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Upload, LogIn, Heart, Home, Search, Info, Mail, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserNav } from '@/components/user-nav'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/browse', label: 'Browse', icon: Search },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
]

interface NavigationClientProps {
  user: {
    id: string
    email: string
  } | null
  profile: {
    firstName: string
    lastName: string
    fullName: string
    username: string
    role: string
  } | null
}

export function NavigationClient({ user, profile }: NavigationClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background">
      {/* Desktop Navigation */}
      <div className="container h-24 px-8 hidden xl:flex items-center justify-between">
        {/* Logo Area - Left */}
        <div className="flex items-center">
          <Link href="/" className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-auto">
              <Image
                src="/images/logo.svg"
                alt="Islamic Resource Corner"
                width={135}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
              A service of Al-Kisa Foundation
            </span>
          </Link>
        </div>

        {/* Navigation Area - Center */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-12">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-lg font-medium text-gray-600 transition-all hover:border-b-2 hover:border-primary pb-1"
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Actions Area - Right */}
        <div className="flex items-center gap-4">
          {/* Donate Button - Always Visible */}
          <Button asChild size="sm" className="bg-brand-yellow hover:bg-brand-yellow-hover text-white">
            <a
              href="https://alkisafoundation.org/donate/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Heart className="h-4 w-4 mr-2" />
              Donate
            </a>
          </Button>

          {user ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>

              <UserNav
                user={{
                  id: user.id,
                  email: user.email || '',
                }}
                profile={{
                  firstName: profile?.firstName || '',
                  lastName: profile?.lastName || '',
                  fullName: profile?.fullName || '',
                  username: profile?.username || '',
                  role: profile?.role || 'user',
                }}
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Navigation */}
      <div className="container h-16 px-4 flex xl:hidden items-center justify-between">
        {/* Logo - Smaller on mobile */}
        <Link href="/" className="flex items-center">
          <div className="relative h-10 w-auto">
            <Image
              src="/images/logo.svg"
              alt="Islamic Resource Corner"
              width={90}
              height={32}
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Right side: Hamburger + User Avatar */}
        <div className="flex items-center gap-3">
          {user && (
            <UserNav
              user={{
                id: user.id,
                email: user.email || '',
              }}
              profile={{
                firstName: profile?.firstName || '',
                lastName: profile?.lastName || '',
                fullName: profile?.fullName || '',
                username: profile?.username || '',
                role: profile?.role || 'user',
              }}
            />
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Sidebar - Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar - Drawer */}
      <div className={`xl:hidden fixed inset-y-0 left-0 z-50 w-[300px] bg-background shadow-xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <Image
              src="/images/logo.svg"
              alt="Islamic Resource Corner"
              width={80}
              height={28}
              className="object-contain"
            />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex flex-col h-[calc(100%-73px)] overflow-y-auto">
          <div className="flex flex-col p-6 space-y-6">
            {/* Navigation Links */}
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 text-base font-medium text-gray-600 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Separator */}
            <div className="border-t" />

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <Button asChild size="default" className="w-full bg-[#ebcc1c] hover:bg-[#d4b619] text-white justify-start">
                <a
                  href="https://alkisafoundation.org/donate/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Donate
                </a>
              </Button>

              {user ? (
                <Button asChild variant="outline" size="default" className="w-full justify-start">
                  <Link href="/dashboard/upload" onClick={() => setIsMobileMenuOpen(false)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resource
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="default" className="w-full justify-start">
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="default" className="w-full justify-start">
                    <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

