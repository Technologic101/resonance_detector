import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './types'

// Get production environment variables for server-side
const getServerSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return { supabaseUrl, supabaseAnonKey }
}

export const createServerClient = () => {
  const cookieStore = cookies()
  const { supabaseUrl, supabaseAnonKey } = getServerSupabaseConfig()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`Missing Supabase server environment variables`)
  }
  
  return createServerComponentClient<Database>({ 
    cookies: () => cookieStore,
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })
}