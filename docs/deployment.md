# Deployment Guide

This guide covers deploying your Next.js + Supabase application to Vercel.

## Prerequisites

- Your code pushed to a GitHub repository
- A Vercel account ([sign up free](https://vercel.com))
- Your Supabase project set up

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

## Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

## Step 3: Configure Environment Variables

In your Vercel project settings, go to **Settings → Environment Variables** and add:

### Required Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### Optional (for admin operations)

- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only!)
- `NEXT_PUBLIC_SITE_URL` - Your production URL (e.g., `https://your-app.vercel.app`)

**Important Notes:**
- `NEXT_PUBLIC_SITE_URL` is optional - Vercel automatically sets `NEXT_PUBLIC_VERCEL_URL`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Add these variables for all environments (Production, Preview, Development)

## Step 4: Configure Supabase Redirect URLs

1. Go to your Supabase Dashboard → **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel deployment URL: `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/**`
   - `http://localhost:3000/auth/callback` (for local development)
   - `http://localhost:3000/**`

## Step 5: Deploy

Vercel will automatically deploy when you push to your main branch. You can also:

1. Click **"Deploy"** in the Vercel dashboard
2. Or trigger a redeploy from the **Deployments** tab

## Step 6: Verify Deployment

1. Visit your Vercel deployment URL
2. Test authentication flows:
   - Sign up
   - Sign in
   - Email confirmation
3. Check Vercel function logs if anything doesn't work

## Environment-Specific Configuration

### Production

- Use your custom domain or Vercel production URL
- Set `NEXT_PUBLIC_SITE_URL` to your production URL
- Ensure all environment variables are set

### Preview Deployments

- Vercel automatically creates preview deployments for pull requests
- Uses `NEXT_PUBLIC_VERCEL_URL` automatically
- Same environment variables apply

### Local Development

- Uses `.env.local` file
- Connects to your live Supabase project
- Hot reload enabled

## Troubleshooting

### Build Fails

- Check that all environment variables are set in Vercel
- Verify `database.types.ts` is committed (or generated during build)
- Check build logs in Vercel dashboard

### Authentication Not Working

- Verify redirect URLs are configured in Supabase
- Check environment variables are set correctly
- Review Vercel function logs for errors

### Database Connection Issues

- Verify Supabase project is active
- Check API keys are correct
- Ensure RLS policies allow access

## Continuous Deployment

Once set up, every push to your main branch will automatically deploy:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will:
1. Build your application
2. Run tests (if configured)
3. Deploy to production
4. Send you a notification

## Custom Domain

To use a custom domain:

1. Go to Vercel project settings → **Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs to include your custom domain

---

For more details, see the [Vercel Documentation](https://vercel.com/docs).

