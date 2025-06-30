import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './types'

// Determine which environment we're in
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_ENV === 'development'

// Get environment-specific variables
const supabaseUrl = isDevelopment 
  ? process.env.NEXT_PUBLIC_SUPABASE_DEV_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = isDevelopment
  ? process.env.NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only throw error at runtime, not during build
const isRuntime = typeof window !== 'undefined'

if (isRuntime && (!supabaseUrl || !supabaseAnonKey)) {
  const envType = isDevelopment ? 'development' : 'production'
  const requiredVars = isDevelopment 
    ? 'NEXT_PUBLIC_SUPABASE_DEV_URL and NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY (or fallback to production vars)'
    : 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  
  throw new Error(`Missing Supabase ${envType} environment variables. Please check your .env.local file and set: ${requiredVars}`)
}

export const createClient = () => {
  // Ensure variables are available when creating client
  if (!supabaseUrl || !supabaseAnonKey) {
    const envType = isDevelopment ? 'development' : 'production'
    const requiredVars = isDevelopment 
      ? 'NEXT_PUBLIC_SUPABASE_DEV_URL and NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY'
      : 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    
    throw new Error(`Missing Supabase ${envType} environment variables. Please set ${requiredVars}.`)
  }
  
  return createClientComponentClient<Database>({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })
}

// Only create the default client if we have the required variables
export const supabase = supabaseUrl && supabaseAnonKey ? createClient() : null

// Export environment info for debugging
export const getEnvironmentInfo = () => ({
  isDevelopment,
  supabaseUrl: supabaseUrl ? `${supabaseUrl.slice(0, 20)}...` : 'Not set',
  hasAnonKey: !!supabaseAnonKey,
  environment: isDevelopment ? 'development' : 'production'
})

// Log environment info in development
if (isDevelopment && isRuntime) {
  console.log('🔧 Supabase Environment:', getEnvironmentInfo())
}