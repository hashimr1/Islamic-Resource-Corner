import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset Password | Islamic Resource Corner',
  description: 'Request a password reset link',
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-accent/30 to-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2 mb-2">
            <BookOpen className="h-10 w-10 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold text-center">Islamic Resource Corner</h1>
          <p className="text-muted-foreground text-center mt-1">
            Recover access to your account
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  )
}

