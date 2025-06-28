import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './types'

// Ensure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const createClient = () => createClientComponentClient<Database>()

export const supabase = createClient()