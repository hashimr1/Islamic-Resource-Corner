import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NavigationClient } from './navigation-client'

export async function Navigation() {
  const supabase = createSupabaseServerClient()
  
  // Check authentication status server-side
  // Use getUser() to refresh the session and get the latest auth state
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // Debug logging
  console.log('Navigation: User status:', user ? `Logged in as ${user.email}` : 'Not logged in')
  if (authError) {
    console.error('Navigation: Auth error:', authError)
  }
  
  // Fetch profile data if user is logged in
  let profile: any = null
  if (user) {
    const { data, error: profileError } = (await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()) as { data: any; error: any }
    
    if (profileError) {
      console.error('Navigation: Profile fetch error:', profileError)
    }
    
    profile = data
    console.log('Navigation: Profile data:', profile ? {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      username: profile.username,
      full_name: profile.full_name
    } : 'No profile found')
  }

  return (
    <NavigationClient 
      user={user ? {
        id: user.id,
        email: user.email || '',
      } : null}
      profile={profile ? {
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        fullName: profile.full_name || '',
        username: profile.username || '',
        role: profile.role || 'user',
      } : null}
    />
  )
}
