# Supabase Setup Guide

This guide will help you set up your Supabase project for the Islamic Resource Corner application.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in Supabase

## Step 1: Get Your Project Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - `Project URL`
   - `anon/public key`
   - `service_role key` (optional, for admin operations)

## Step 2: Configure Environment Variables

1. In your project root, create a `.env.local` file
2. Add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Run the Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `schema.sql` from this directory
5. Click **Run** to execute the schema

This will create:
- `profiles` table (extends auth.users)
- `resources` table (stores all educational resources)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic updates
- Storage policies

## Step 4: Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it `resources`
4. Set it to **Private** (we handle access through policies)
5. Configure settings:
   - File size limit: 50MB (or your preference)
   - Allowed MIME types: `application/pdf`, `image/*`, `application/vnd.ms-excel`, etc.

## Step 5: Set Up Authentication

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Email** provider
3. Configure email templates (optional):
   - Confirmation email
   - Magic link
   - Password recovery

## Step 6: Create Admin User

After you've signed up your first user:

1. Go to **SQL Editor**
2. Run this query (replace with your email):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

## Step 7: Test Your Setup

1. Start your development server: `npm run dev`
2. Try signing up a new user
3. Check if the profile is created automatically
4. Try uploading a resource (as a contributor)
5. Try approving a resource (as an admin)

## Database Schema Overview

### Tables

**profiles**
- `id` (UUID, references auth.users)
- `email` (text)
- `full_name` (text)
- `role` (user | admin)
- `created_at` (timestamp)

**resources**
- `id` (UUID)
- `title` (text)
- `description` (text)
- `file_url` (text)
- `category` (text)
- `grade_level` (text)
- `status` (pending | approved | rejected)
- `user_id` (UUID, references profiles)
- `downloads` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Security Notes

- Never commit `.env.local` to version control
- Keep your `service_role_key` secret and only use it server-side
- The `anon` key is safe to use in the browser
- Row Level Security (RLS) ensures data access is properly controlled

## Troubleshooting

**Issue: Can't insert profiles**
- Make sure the trigger `on_auth_user_created` is enabled
- Check that the function `handle_new_user()` exists

**Issue: Can't upload files**
- Verify the `resources` storage bucket exists
- Check storage policies are created
- Ensure your file size is within limits

**Issue: Admin routes not working**
- Verify your user's role is set to 'admin' in the profiles table
- Clear browser cache and re-login

## Need Help?

- Check [Supabase Documentation](https://supabase.com/docs)
- Visit [Supabase Discord](https://discord.supabase.com)

