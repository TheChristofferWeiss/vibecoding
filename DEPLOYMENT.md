# Complete Deployment Guide

This is a step-by-step guide to fully deploy your Next.js + Supabase application to production.

## 📋 Pre-Deployment Checklist

Before deploying, ensure:
- ✅ Build passes locally (`npm run build`)
- ✅ Application works locally (`npm run dev`)
- ✅ All environment variables are documented
- ✅ Database migrations are ready
- ✅ Supabase project is set up and active

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Code

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   ```

2. **Verify build works:**
   ```bash
   npm run build
   ```

### Step 2: Push to GitHub

If you haven't already:

1. **Create a GitHub repository** (if needed):
   - Go to [github.com](https://github.com) and create a new repository
   - Don't initialize with README, .gitignore, or license (you already have these)

2. **Push your code:**
   ```bash
   # If you haven't set up remote yet
   git remote add origin https://github.com/yourusername/your-repo.git
   git branch -M main
   git push -u origin main
   
   # If remote already exists
   git push origin main
   ```

### Step 3: Set Up Vercel

1. **Sign in to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import your project:**
   - Click **"Add New..."** → **"Project"**
   - Select your GitHub repository
   - Click **"Import"**

3. **Configure project settings:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Click "Deploy"** (we'll add environment variables next)

### Step 4: Configure Environment Variables in Vercel

1. **Go to Project Settings:**
   - In your Vercel project dashboard, go to **Settings** → **Environment Variables**

2. **Add Required Variables:**
   
   Add these for **Production, Preview, and Development** environments:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   Add this for **Production and Preview** (optional but recommended):
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
   
   **Where to find these values:**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

3. **Save and redeploy:**
   - After adding variables, go to **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Select **"Redeploy"**

### Step 5: Configure Supabase Redirect URLs

1. **Go to Supabase Dashboard:**
   - Navigate to your project
   - Go to **Authentication** → **URL Configuration**

2. **Set Site URL:**
   - Get your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - Set **Site URL** to: `https://your-app.vercel.app`

3. **Add Redirect URLs:**
   Add these exact URLs:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```
   
   **Note:** The `/**` wildcard allows all paths under your domain.

4. **Save changes**

### Step 6: Run Database Migrations (if needed)

If you have database migrations that haven't been applied:

1. **Using Supabase Dashboard:**
   - Go to **SQL Editor** in Supabase Dashboard
   - Copy the contents of `supabase/migrations/20240101000000_setup_user_roles.sql`
   - Paste and run in SQL Editor

2. **Using Supabase CLI:**
   ```bash
   # Link to your project (if not already linked)
   supabase link --project-ref your-project-ref
   
   # Push migrations
   supabase db push
   ```

### Step 7: Verify Deployment

1. **Visit your deployment:**
   - Go to your Vercel deployment URL
   - You should see your application

2. **Test authentication:**
   - Try signing up with a new account
   - Check your email for confirmation (if enabled)
   - Sign in
   - Access the dashboard
   - Sign out

3. **Check for errors:**
   - Open browser DevTools (F12)
   - Check Console for errors
   - Check Network tab for failed requests

4. **Check Vercel logs:**
   - Go to Vercel Dashboard → **Deployments**
   - Click on your deployment
   - Check **Functions** tab for server-side errors

### Step 8: Set Up Custom Domain (Optional)

1. **In Vercel Dashboard:**
   - Go to **Settings** → **Domains**
   - Click **"Add Domain"**
   - Enter your domain name

2. **Configure DNS:**
   - Follow Vercel's DNS instructions
   - Add the required DNS records to your domain provider

3. **Update Supabase:**
   - Go back to Supabase → **Authentication** → **URL Configuration**
   - Add your custom domain to redirect URLs:
     ```
     https://your-custom-domain.com/auth/callback
     https://your-custom-domain.com/**
     ```

## 🔄 Continuous Deployment

Once set up, every push to your `main` branch will automatically:
1. Trigger a new build
2. Run tests (if configured)
3. Deploy to production
4. Send you a notification

**Workflow:**
```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel automatically deploys!
```

## 🧪 Testing Your Deployment

### Quick Test Checklist

- [ ] Home page loads
- [ ] Sign up works
- [ ] Email confirmation received (if enabled)
- [ ] Sign in works
- [ ] Dashboard accessible after login
- [ ] Sign out works
- [ ] Protected routes redirect to login
- [ ] No console errors
- [ ] No network errors

### Common Issues

**Issue: Authentication not working**
- ✅ Check Supabase redirect URLs include your Vercel URL
- ✅ Verify environment variables are set correctly
- ✅ Check Vercel function logs for errors

**Issue: Build fails**
- ✅ Check all environment variables are set
- ✅ Verify `database.types.ts` is committed
- ✅ Check build logs in Vercel dashboard

**Issue: Database connection errors**
- ✅ Verify Supabase project is active
- ✅ Check API keys are correct
- ✅ Ensure RLS policies allow access

## 📊 Monitoring

### Vercel Analytics
- Go to **Analytics** tab in Vercel dashboard
- Monitor performance, errors, and usage

### Supabase Dashboard
- Monitor database usage
- Check authentication logs
- Review API usage

## 🔐 Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT exposed to client
- [ ] Environment variables are set in Vercel (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] RLS policies are configured
- [ ] HTTPS is enabled (automatic on Vercel)

## 📝 Environment Variables Reference

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Optional (Recommended)
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

**Note:** `NEXT_PUBLIC_SITE_URL` is optional - Vercel automatically provides `NEXT_PUBLIC_VERCEL_URL`.

## 🎉 You're Deployed!

Your application is now live! Every push to `main` will automatically deploy to production.

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Project Troubleshooting Guide](./docs/troubleshooting.md)

