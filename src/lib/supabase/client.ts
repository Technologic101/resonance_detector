import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './types'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only throw error at runtime, not during build
const isRuntime = typeof window !== 'undefined'

if (isRuntime && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const createClient = () => {
  // Ensure variables are available when creating client
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  
  return createClientComponentClient<Database>()
}

// Only create the default client if we have the required variables
export const supabase = supabaseUrl && supabaseAnonKey ? createClient() : null