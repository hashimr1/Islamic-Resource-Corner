# Islamic Resource Corner

A free platform for sharing Islamic educational resources, built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🌟 Features

- **Public Access**: Browse and download approved Islamic educational resources without signing in
- **User Authentication**: Sign up to become a contributor
- **Resource Upload**: Contributors can upload PDFs, worksheets, and other educational materials
- **Admin Approval System**: All uploads are reviewed by admins before going live
- **Advanced Search**: Filter by category, grade level, and keywords
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Beautiful UI**: Clean, calming design with Islamic-inspired color palette (deep greens, golds, soft teals)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- npm, yarn, or pnpm package manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd islamic-resource-corner
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a new project in [Supabase](https://supabase.com)
2. Go to **Settings** → **API** and copy:
   - Project URL
   - `anon/public` key
   - `service_role` key (optional, for admin operations)

3. Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Run the database schema:
   - Open the Supabase SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Click **Run** to execute

5. Create the storage bucket:
   - Go to **Storage** in Supabase
   - Create a new bucket named `resources`
   - Set it to **Private**
   - Configure file size limit (recommended: 50MB)

For detailed setup instructions, see [supabase/README.md](./supabase/README.md)

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create an Admin User

After signing up your first user:

1. Go to Supabase SQL Editor
2. Run this query (replace with your email):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

## 📁 Project Structure

```
islamic-resource-corner/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── browse/            # Browse resources page
│   ├── resource/[id]/     # Resource detail page
│   ├── dashboard/         # User dashboard
│   ├── admin/             # Admin panel
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # Shadcn/UI components
│   └── navigation.tsx    # Navigation component
├── lib/                   # Utilities and helpers
│   ├── actions/          # Server actions
│   │   ├── auth.ts       # Authentication actions
│   │   └── resources.ts  # Resource actions
│   ├── supabase/         # Supabase client config
│   │   ├── client.ts     # Client-side client
│   │   ├── server.ts     # Server-side client
│   │   └── middleware.ts # Middleware client
│   ├── constants.ts      # App constants
│   └── utils.ts          # Utility functions
├── supabase/             # Supabase configuration
│   ├── schema.sql        # Database schema
│   └── README.md         # Supabase setup guide
├── middleware.ts         # Next.js middleware
└── package.json          # Dependencies
```

## 🎨 Key Pages

- **`/`** - Landing page with featured resources
- **`/browse`** - Browse all approved resources with filters
- **`/resource/[id]`** - Resource detail and download page
- **`/dashboard`** - User dashboard (protected)
- **`/dashboard/upload`** - Upload new resources (protected)
- **`/admin`** - Admin panel for approving resources (admin only)
- **`/auth/login`** - Sign in page
- **`/auth/signup`** - Sign up page

## 🔐 User Roles

- **Public**: Can browse and download approved resources
- **User/Contributor**: Can upload resources (pending admin approval)
- **Admin**: Can approve/reject resources and access admin panel

## 📝 Database Schema

### Profiles Table
- `id` - References auth.users
- `email` - User email
- `full_name` - User's full name
- `role` - 'user' or 'admin'
- `created_at` - Timestamp

### Resources Table
- `id` - UUID
- `title` - Resource title
- `description` - Resource description
- `file_url` - Link to file in storage
- `category` - Resource category
- `grade_level` - Target grade level
- `status` - 'pending', 'approved', or 'rejected'
- `user_id` - References profiles.id
- `downloads` - Download count
- `created_at` - Timestamp
- `updated_at` - Timestamp

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available for free use by the Muslim community.

## 🙏 Acknowledgments

Built with the intention of making Islamic education more accessible to teachers, parents, and students worldwide. May Allah accept this effort.

## 🐛 Issues & Support

If you encounter any issues or have questions:
1. Check the [Supabase setup guide](./supabase/README.md)
2. Open an issue in the repository
3. Contact the development team

## 🔮 Future Enhancements

- [ ] Resource preview functionality
- [ ] User ratings and reviews
- [ ] Resource collections/playlists
- [ ] Email notifications for approval status
- [ ] Advanced analytics for contributors
- [ ] Multi-language support
- [ ] Mobile app

---

**Made with ❤️ for the Muslim Ummah**

