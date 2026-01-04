import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Sign Up | Islamic Resource Corner',
  description: 'Create your account',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-accent/30 to-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2 mb-2">
            <BookOpen className="h-10 w-10 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold text-center">Islamic Resource Corner</h1>
          <p className="text-muted-foreground text-center mt-1">
            Create an account to start contributing
          </p>
        </div>

        {/* Signup Form Card */}
        <SignupForm />

        {/* Additional Links */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

