import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

/**
 * Creates an admin Supabase client with service role key.
 * ⚠️ WARNING: Only use this on the server-side! Never expose the service role key to the client.
 * 
 * This client bypasses Row Level Security (RLS) and should only be used for:
 * - User invitations
 * - User deletions
 * - Other admin operations
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

