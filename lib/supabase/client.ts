import { createBrowserClient } from '@supabase/ssr'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          username: string | null
          country: string | null
          occupation: string | null
          role: 'user' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          username?: string | null
          country?: string | null
          occupation?: string | null
          role?: 'user' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          username?: string | null
          country?: string | null
          occupation?: string | null
          role?: 'user' | 'admin'
          created_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string
          short_description: string | null
          file_url: string
          file_size: number | null
          file_type: string | null
          preview_image_url: string | null
          category: string
          grade_level: string | null
          grades: string[]
          subjects: string[]
          resource_types: string[]
          topics_islamic: string[]
          topics_general: string[]
          credits: string | null
          copyright_verified: boolean
          status: 'pending' | 'approved' | 'rejected'
          user_id: string
          downloads: number
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          short_description?: string | null
          file_url: string
          file_size?: number | null
          file_type?: string | null
          preview_image_url?: string | null
          category: string
          grade_level?: string | null
          grades?: string[]
          subjects?: string[]
          resource_types?: string[]
          topics_islamic?: string[]
          topics_general?: string[]
          credits?: string | null
          copyright_verified?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          user_id: string
          downloads?: number
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          short_description?: string | null
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          preview_image_url?: string | null
          category?: string
          grade_level?: string | null
          grades?: string[]
          subjects?: string[]
          resource_types?: string[]
          topics_islamic?: string[]
          topics_general?: string[]
          credits?: string | null
          copyright_verified?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          user_id?: string
          downloads?: number
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_featured_lists: {
        Row: {
          id: string
          title: string
          filter_criteria: Record<string, any>
          is_active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          filter_criteria?: Record<string, any>
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          filter_criteria?: Record<string, any>
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Client-side Supabase client (for use in Client Components)
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
