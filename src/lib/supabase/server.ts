import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '../database.types'

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * This client uses cookies to maintain the user session.
 */
export const createClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

