# Vibecoding startup


## 📚 Documentation

- **[Complete Setup Guide](./docs/setup-guide.md)** - Step-by-step setup instructions
- **[User Management Guide](./docs/user-management.md)** - Authentication, roles, and user management
- **[Deployment Guide](./docs/deployment.md)** - Vercel deployment and production considerations
- **[Troubleshooting](./docs/troubleshooting.md)** - Common issues and solutions

## ✨ Features

- ✅ **Authentication** - Email/password with Supabase Auth
- ✅ **User Roles** - Role-based access control (Admin, User, etc.)
- ✅ **Database** - PostgreSQL with Row Level Security
- ✅ **Type Safety** - Auto-generated TypeScript types from database
- ✅ **Server Actions** - Next.js 14 App Router with server actions
- ✅ **Deployment Ready** - Configured for Vercel deployment
- ✅ **Local Development** - Hot reload with live Supabase backend

## 🏗️ Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── auth/         # Authentication pages
│   │   └── (protected)/  # Protected routes
│   ├── components/       # React components
│   └── lib/              # Utilities and helpers
│       ├── supabase/     # Supabase client helpers
│       └── database.types.ts  # Generated types
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions (optional)
├── docs/                 # Documentation
└── public/               # Static assets
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: [Vercel](https://vercel.com)
- **Styling**: Tailwind CSS (optional)
- **Language**: TypeScript

## 📖 Development Workflow

This starter uses a **"local frontend, live backend"** approach:

- **Frontend**: Run locally with `npm run dev` for instant feedback
- **Backend**: Connect directly to your cloud Supabase project
- **Deploy**: Push to GitHub and Vercel auto-deploys

## 🔐 Environment Variables

### Required

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### Optional (for admin operations)

- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only!)
- `NEXT_PUBLIC_SITE_URL` - Your production URL (for email links)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this for your projects!

## 🙏 Acknowledgments

Built with experience from production deployments. This starter includes solutions to common issues encountered when building with Next.js, Supabase, and Vercel.

---

**Need help?** Check the [documentation](./docs/) or [open an issue](https://github.com/yourusername/nextjs-supabase-vercel-starter/issues).

