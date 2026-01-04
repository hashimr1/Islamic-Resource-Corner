'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { updateProfile } from '@/lib/actions/profile'
import { OCCUPATION_OPTIONS } from '@/lib/constants'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ProfileFormProps {
  profile: {
    firstName: string
    lastName: string
    username: string
    country: string
    occupation: string
  }
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [occupation, setOccupation] = useState(profile.occupation)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(event.currentTarget)
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const username = formData.get('username') as string
    const country = formData.get('country') as string

    // Validation
    if (!firstName || !lastName || !username || !country || !occupation) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    if (firstName.length < 2 || lastName.length < 2) {
      setError('First and last name must be at least 2 characters')
      setIsLoading(false)
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      setIsLoading(false)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      setIsLoading(false)
      return
    }

    const result = await updateProfile({
      firstName,
      lastName,
      username,
      country,
      occupation,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
    
    // Refresh the page to show updated data
    setTimeout(() => {
      router.refresh()
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-primary/50 bg-primary/10">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Your profile has been updated successfully</AlertDescription>
        </Alert>
      )}

      {/* First Name & Last Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            defaultValue={profile.firstName}
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            defaultValue={profile.lastName}
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>
      </div>

      {/* Username & Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            defaultValue={profile.username}
            required
            disabled={isLoading}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Letters, numbers, and underscores only
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            type="text"
            defaultValue={profile.country}
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>
      </div>

      {/* Occupation */}
      <div className="space-y-2">
        <Label htmlFor="occupation">Occupation/Role</Label>
        <Select
          value={occupation}
          onValueChange={setOccupation}
          disabled={isLoading}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            {OCCUPATION_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full h-11"
        disabled={isLoading || success}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving changes...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Saved!
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}

