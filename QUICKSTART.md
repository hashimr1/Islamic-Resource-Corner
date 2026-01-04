# Quick Start Guide - Islamic Resource Corner

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Set Up Supabase (2 minutes)

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your credentials from **Settings** → **API**
3. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Set Up Database (1 minute)

1. Go to **SQL Editor** in Supabase
2. Copy contents of `supabase/schema.sql`
3. Paste and click **Run**
4. Copy contents of `supabase/functions.sql`
5. Paste and click **Run**

## Step 4: Create Storage Bucket (30 seconds)

1. Go to **Storage** in Supabase
2. Click **Create a new bucket**
3. Name it `resources`
4. Set it to **Private**
5. Click **Create**

## Step 5: Run the App (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Create Admin User

1. Sign up at `/auth/signup`
2. In Supabase SQL Editor, run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## That's It! 🎉

You now have:
- ✅ A working Next.js app
- ✅ Database with proper security
- ✅ File storage configured
- ✅ Admin access

## Next Steps

- Upload your first resource at `/dashboard/upload`
- Approve it from `/admin`
- Browse resources at `/browse`

## Need Help?

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for detailed setup.

## Common Issues

**Can't connect to Supabase?**
- Check `.env.local` has correct credentials
- Restart dev server after adding environment variables

**Tables not created?**
- Run `schema.sql` again in SQL Editor
- Check for error messages in Supabase

**Storage not working?**
- Verify bucket named `resources` exists
- Check it's set to Private (not Public)

---

**Happy building!** 🚀

