import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../database.types'

/**
 * Creates a Supabase client for use in Client Components.
 * This client is safe to use in browser environments.
 */
export const createClient = () => createPagesBrowserClient<Database>()

