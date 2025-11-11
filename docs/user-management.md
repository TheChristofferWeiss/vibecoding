# Cursor Base Setup Guide: User Management & Authentication

This guide documents everything learned about setting up user management, authentication, and role-based access control with Next.js, Supabase, and Vercel. It includes critical lessons learned from both localhost development and Vercel production deployments.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [User Invitation System](#user-invitation-system)
3. [User Deletion](#user-deletion)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Vercel-Specific Considerations](#vercel-specific-considerations)
6. [Localhost vs Production Differences](#localhost-vs-production-differences)
7. [Testing Checklist](#testing-checklist)

---

## Environment Setup

### Required Environment Variables

#### Localhost (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Vercel Production
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app  # Optional but recommended
```

**Critical Notes:**
- `NEXT_PUBLIC_SITE_URL` is optional on Vercel - it will automatically use `NEXT_PUBLIC_VERCEL_URL` if not set
- `SUPABASE_SERVICE_ROLE_KEY` MUST be set in Vercel environment variables
- Never commit service role keys to git
- Service role key is server-side only - never expose to client

### Supabase Configuration

#### Redirect URLs (Authentication → URL Configuration)
Add these redirect URLs in Supabase Dashboard:
- `http://localhost:3000/auth/callback` (development)
- `https://your-app.vercel.app/auth/callback` (production)

#### Email Templates
- Invite emails are sent automatically by Supabase
- Customize templates in Supabase Dashboard → Authentication → Email Templates

---

## User Invitation System

### How It Works

1. **Admin invites user** → Server action calls `supabaseAdmin.auth.admin.inviteUserByEmail()`
2. **User receives email** → Contains magic link with hash fragment
3. **User clicks link** → Redirected to `/auth/callback`
4. **Callback handler** → Processes hash fragment and sets session
5. **Password setup** → User redirected to `/auth/setup-password` if type is 'invite'
6. **Profile creation** → Trigger automatically creates profile with role from metadata

### Critical Implementation Details

#### Server Action: inviteUser

```typescript
export async function inviteUser(
  email: string, 
  role: 'admin' | 'producer' | 'operator' = 'operator'
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  
  // Admin check...
  
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // CRITICAL: URL construction for localhost vs Vercel
  let siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??      // Production: set explicitly
    process.env.NEXT_PUBLIC_VERCEL_URL ??   // Vercel: auto-set
    'http://localhost:3000';                 // Fallback: localhost

  // Ensure proper protocol
  siteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
  // Ensure trailing slash
  siteUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;

  const redirectTo = `${siteUrl}auth/callback`;
  
  // Invite with role in metadata
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      invited_role: role, // Stored in user metadata
    },
  });

  // Handle immediate user creation (if user already exists)
  if (inviteData?.user?.id) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for trigger
    
    await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', inviteData.user.id);
  }

  return { success: true, error: null };
}
```

#### Auth Callback Handler (`/auth/callback/page.tsx`)

```typescript
'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      // Handle OAuth codes (email confirmations)
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`)
          return
        }
        router.replace('/auth/confirm')
        return
      }

      // Handle hash fragments (invite links)
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (!accessToken) {
          router.replace('/login?error=Invalid authentication data')
          return
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`)
          return
        }

        // CRITICAL: Check type to route to password setup
        if (type === 'invite') {
          router.replace('/auth/setup-password')
        } else {
          router.replace('/admin')
        }
        return
      }

      router.replace('/login?error=No authentication data')
    }

    handleAuthCallback()
  }, [router, searchParams])

  return <div>Completing authentication...</div>
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  )
}
```

#### Password Setup Page (`/auth/setup-password/page.tsx`)

```typescript
'use client'
import UpdatePassword from '@/app/auth/components/UpdatePassword'

export default function SetupPasswordPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <UpdatePassword />
    </div>
  )
}
```

#### UpdatePassword Component

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UpdatePassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setPassword('')
      // CRITICAL: Redirect after successful password setup
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
    }
  }

  // ... rest of component
}
```

### Database Trigger for Role Assignment

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invited_role public.app_role;
BEGIN
  -- Check if user was invited with a specific role
  IF new.raw_user_meta_data->>'invited_role' IS NOT NULL THEN
    invited_role := (new.raw_user_meta_data->>'invited_role')::public.app_role;
  ELSE
    invited_role := 'operator'::public.app_role; -- Default role
  END IF;

  -- Insert profile with role
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, invited_role);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## User Deletion

### Critical Implementation Details

#### Server Action: deleteUser

```typescript
export async function deleteUser(userId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  
  // Admin check...
  
  // CRITICAL: Check service role key exists
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    return { success: false, error: 'Server configuration error: Service role key not found.' };
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: deleteData, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    // Handle specific error types
    if (error.message?.includes('foreign key') || error.message?.includes('constraint')) {
      return { success: false, error: 'Cannot delete user: User has associated data. Please remove related records first.' };
    }
    if (error.message?.includes('storage') || error.message?.includes('bucket')) {
      return { success: false, error: 'Cannot delete user: User owns storage objects. Please remove or reassign them first.' };
    }
    return { success: false, error: error.message || 'Failed to delete user.' };
  }

  // CRITICAL: Verify deletion succeeded
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for propagation
  
  const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
  const userStillExists = usersList?.users?.some(u => u.id === userId);
  
  if (userStillExists) {
    return { success: false, error: 'User deletion may have failed. User still exists in the system.' };
  }

  return { success: true, error: null };
}
```

### Filtering Deleted Users

**CRITICAL:** Supabase uses soft deletion. Deleted users have `deleted_at` set but still exist in `auth.users`. You MUST filter them out:

```sql
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role public.app_role,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Admin check...
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    p.full_name,
    p.role,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.deleted_at IS NULL  -- CRITICAL: Filter out soft-deleted users
  ORDER BY u.created_at DESC;
END;
$$;
```

---

## Common Issues & Solutions

### Issue 1: 406 Error When Fetching API Keys

**Problem:** `Failed to load resource: the server responded with a status of 406`

**Cause:** Using `.single()` when no rows exist

**Solution:** Use `.maybeSingle()` instead

```typescript
// ❌ Wrong
const { data, error } = await supabase
  .from('api_keys')
  .select('*')
  .eq('user_id', userId)
  .single(); // Returns 406 if no rows

// ✅ Correct
const { data, error } = await supabase
  .from('api_keys')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle(); // Returns null if no rows
```

### Issue 2: Confirmation Dialog Not Showing on Vercel

**Problem:** `window.confirm()` doesn't show on Vercel

**Solution:** Ensure button has proper event handling

```typescript
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDeleteUser(user.id, user.email);
  }}
  type="button"  // CRITICAL: Prevent form submission
  disabled={updating}
>
  Delete
</button>
```

### Issue 3: Deleted Users Reappear After Refresh

**Problem:** Users show up again after deletion

**Cause:** Not filtering soft-deleted users (`deleted_at IS NOT NULL`)

**Solution:** Add `WHERE u.deleted_at IS NULL` to all user queries

### Issue 4: User Invite Redirects to Wrong URL

**Problem:** Invite links redirect to localhost on Vercel

**Cause:** Not using correct environment variable priority

**Solution:** Use this pattern:
```typescript
let siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??      // Explicit production URL
  process.env.NEXT_PUBLIC_VERCEL_URL ??    // Auto-set by Vercel
  'http://localhost:3000';                 // Fallback

siteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
siteUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
```

### Issue 5: Audio Buffer Serialization Error

**Problem:** Server action can't return Buffer objects

**Solution:** Convert to base64 string

```typescript
// Server action
const content = Buffer.concat(chunks);
const base64Audio = content.toString('base64');
return { audio: base64Audio, error: null };

// Client component
const binaryString = atob(result.audio);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}
const blob = new Blob([bytes], { type: 'audio/mpeg' });
```

---

## Vercel-Specific Considerations

### Environment Variables

1. **Always set `SUPABASE_SERVICE_ROLE_KEY`** - Required for admin operations
2. **`NEXT_PUBLIC_SITE_URL` is optional** - Vercel auto-sets `NEXT_PUBLIC_VERCEL_URL`
3. **Redeploy after adding env vars** - Changes require redeployment

### URL Handling

- Vercel automatically sets `NEXT_PUBLIC_VERCEL_URL` (e.g., `your-app-abc123.vercel.app`)
- For production domains, set `NEXT_PUBLIC_SITE_URL` explicitly
- Always ensure URLs have proper protocol (`https://`) and trailing slash

### Debugging on Vercel

1. **Check Function Logs** - Vercel Dashboard → Functions → Logs
2. **Add console.log statements** - Visible in Vercel logs
3. **Test environment variables** - Log them (but never log secrets!)

```typescript
console.log('Environment check:', {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY, // Don't log the actual key!
});
```

### Common Vercel Issues

1. **Service role key not set** → Admin operations fail silently
2. **Redirect URLs not configured** → Auth callbacks fail
3. **Environment variables not redeployed** → Old values persist

---

## Localhost vs Production Differences

### URL Construction

| Environment | URL Source | Example |
|------------|------------|---------|
| Localhost | `NEXT_PUBLIC_SITE_URL` or fallback | `http://localhost:3000` |
| Vercel Preview | `NEXT_PUBLIC_VERCEL_URL` (auto) | `https://app-abc123.vercel.app` |
| Vercel Production | `NEXT_PUBLIC_SITE_URL` (if set) | `https://yourdomain.com` |

### Authentication Flow

**Localhost:**
- Uses `http://localhost:3000/auth/callback`
- No SSL certificate issues
- Faster iteration

**Vercel:**
- Uses `https://your-app.vercel.app/auth/callback`
- Requires proper redirect URL configuration
- May have slight delay in propagation

### Database Migrations

**Localhost:**
- Run via Supabase CLI: `supabase db push`
- Or via local Supabase instance

**Production:**
- Run via Supabase Dashboard SQL Editor
- Or via Supabase CLI with production connection
- **Always test migrations locally first!**

---

## Testing Checklist

### User Invitation Flow

- [ ] Admin can invite user with specific role
- [ ] Invite email is received
- [ ] Clicking invite link redirects to `/auth/callback`
- [ ] User is redirected to `/auth/setup-password`
- [ ] User can set password
- [ ] User is redirected to `/admin` after password setup
- [ ] User profile has correct role assigned
- [ ] Works on localhost
- [ ] Works on Vercel

### User Deletion Flow

- [ ] Admin can delete user
- [ ] Confirmation dialog appears
- [ ] User is removed from list immediately
- [ ] User doesn't reappear after refresh
- [ ] Deleted user can't log in
- [ ] Error messages are clear
- [ ] Works on localhost
- [ ] Works on Vercel

### User Management

- [ ] Admin can view all users
- [ ] Admin can update user roles
- [ ] Admin can search/filter users
- [ ] Deleted users are filtered out
- [ ] Role-based access control works
- [ ] Works on localhost
- [ ] Works on Vercel

### Environment Variables

- [ ] All required env vars are set
- [ ] Service role key is set (Vercel)
- [ ] Redirect URLs are configured (Supabase)
- [ ] URL construction works correctly
- [ ] Debug logs show correct values

---

## Best Practices

### Security

1. **Never expose service role key** - Server-side only
2. **Always check admin role** - Both client and server
3. **Use RLS policies** - Database-level security
4. **Validate on server** - Never trust client-side checks alone

### Error Handling

1. **Provide specific error messages** - Help users understand issues
2. **Log errors server-side** - For debugging
3. **Handle edge cases** - Empty results, network failures, etc.
4. **Verify operations** - Don't assume success

### Code Organization

1. **Server actions for mutations** - Keep sensitive operations server-side
2. **Client components for UI** - Keep interactivity client-side
3. **Database functions for complex queries** - Reusable and secure
4. **Type safety** - Use TypeScript types throughout

### Testing

1. **Test on localhost first** - Faster iteration
2. **Test on Vercel preview** - Catch deployment issues
3. **Test production** - Final verification
4. **Test error cases** - What happens when things go wrong?

---

## Quick Reference

### Environment Variables Priority

```typescript
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??      // 1. Explicit production URL
  process.env.NEXT_PUBLIC_VERCEL_URL ??    // 2. Vercel auto-set
  'http://localhost:3000';                 // 3. Fallback
```

### Supabase Client Creation

```typescript
// Client-side (browser)
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server-side (server actions, API routes)
import { createClient } from '@/lib/supabase/server';
const supabase = createClient();

// Admin operations (server-side only)
import { createClient as createAdminClient } from '@supabase/supabase-js';
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Common Query Patterns

```typescript
// Single row (may not exist)
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .maybeSingle(); // Returns null if no row

// Single row (must exist)
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single(); // Returns error if no row

// Multiple rows
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('status', 'active');
```

---

## Migration Checklist

When setting up user management in a new project:

1. [ ] Create `app_role` enum type
2. [ ] Create `profiles` table with role column
3. [ ] Set up RLS policies for profiles
4. [ ] Create `get_my_role()` helper function
5. [ ] Create `handle_new_user()` trigger function
6. [ ] Create `get_all_users_with_profiles()` function (with `deleted_at IS NULL`)
7. [ ] Set up cascade delete on profiles
8. [ ] Configure Supabase redirect URLs
9. [ ] Set up auth callback page
10. [ ] Set up password setup page
11. [ ] Set environment variables (localhost and Vercel)
12. [ ] Test invite flow (localhost)
13. [ ] Test invite flow (Vercel)
14. [ ] Test deletion flow (localhost)
15. [ ] Test deletion flow (Vercel)

---

## Troubleshooting

### User invite not working on Vercel

1. Check `SUPABASE_SERVICE_ROLE_KEY` is set
2. Check redirect URLs in Supabase Dashboard
3. Check Vercel function logs for errors
4. Verify URL construction in logs

### User deletion not working

1. Check `SUPABASE_SERVICE_ROLE_KEY` is set
2. Check for foreign key constraints
3. Check for storage objects owned by user
4. Verify deletion in Supabase Dashboard
5. Check if `deleted_at` filter is applied

### Users reappearing after deletion

1. Ensure `WHERE u.deleted_at IS NULL` in queries
2. Run migration to update database function
3. Clear browser cache
4. Verify soft deletion in Supabase Dashboard

---

*Last updated: Based on production experience with Next.js, Supabase, and Vercel*

