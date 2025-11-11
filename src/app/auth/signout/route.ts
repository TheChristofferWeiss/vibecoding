import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Sign out route handler
 * 
 * Signs out the current user and redirects to the home page.
 */
export async function POST(request: Request) {
  const supabase = createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/', request.url))
}

