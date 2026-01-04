import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/actions/profile'
import { ProfileForm } from '@/components/profile/profile-form'
import { PasswordForm } from '@/components/profile/password-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage() {
  const data = (await getProfile()) as any

  if (!data) {
    redirect('/auth/login')
  }

  const { user, profile } = data

  return (
    <div className="container py-8 max-w-4xl">
      <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and profile information
            </p>
          </div>

          <Separator />

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details and public profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                profile={{
                  firstName: profile?.first_name || '',
                  lastName: profile?.last_name || '',
                  username: profile?.username || '',
                  country: profile?.country || '',
                  occupation: profile?.occupation || '',
                }}
              />
            </CardContent>
          </Card>

          {/* Email (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
              <CardDescription>
                Your email address is used for login and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Update */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Role</p>
                <p className="text-sm">
                  {profile?.role === 'admin' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Administrator
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
                      Contributor
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}

