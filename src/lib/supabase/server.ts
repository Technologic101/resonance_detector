import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './types'

// Determine which environment we're in
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_ENV === 'development'

// Get environment-specific variables for server-side
const getServerSupabaseConfig = () => {
  const supabaseUrl = isDevelopment 
    ? process.env.NEXT_PUBLIC_SUPABASE_DEV_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey = isDevelopment
    ? process.env.NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return { supabaseUrl, supabaseAnonKey }
}

export const createServerClient = () => {
  const cookieStore = cookies()
  const { supabaseUrl, supabaseAnonKey } = getServerSupabaseConfig()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    const envType = isDevelopment ? 'development' : 'production'
    throw new Error(`Missing Supabase ${envType} server environment variables`)
  }
  
  return createServerComponentClient<Database>({ 
    cookies: () => cookieStore,
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })
}