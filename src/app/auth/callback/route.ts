import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback route handler
 * 
 * This route handles the redirect from Supabase after email confirmation or OAuth.
 * It exchanges the code for a session and redirects the user appropriately.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}

