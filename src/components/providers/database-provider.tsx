"use client"

import React, { createContext, useContext, useMemo } from 'react'
import { getDatabase } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/auth-provider'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

// Define the database instance type
type DatabaseInstance = ReturnType<typeof getDatabase>

interface DatabaseContextType {
  database: DatabaseInstance
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { supabase } = useAuth()

  // Create database instance only once using useMemo
  // This ensures the same instance is reused unless supabase client changes
  const database = useMemo(() => {
    return getDatabase(supabase)
  }, [supabase])

  return (
    <DatabaseContext.Provider value={{ database }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context.database
}