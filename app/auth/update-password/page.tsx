import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'

export const metadata: Metadata = {
  title: 'Update Password | Islamic Resource Corner',
  description: 'Set a new password after resetting your account',
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-accent/30 to-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2 mb-2">
            <BookOpen className="h-10 w-10 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold text-center">Islamic Resource Corner</h1>
          <p className="text-muted-foreground text-center mt-1">
            Secure your account with a new password
          </p>
        </div>

        <UpdatePasswordForm />
      </div>
    </div>
  )
}

