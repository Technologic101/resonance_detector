"use client"

import React, { createContext, useContext, useMemo } from 'react'
import { getDatabase } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/auth-provider'

// Define the database instance type
type DatabaseInstance = ReturnType<typeof getDatabase>

interface DatabaseContextType {
  database: DatabaseInstance
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useAuth()

  // Create database instance and recreate it when user authentication changes
  // This ensures the database instance uses an authenticated supabase client
  const database = useMemo(() => {
    console.log('Creating database instance, user:', user ? user.id : 'none')
    return getDatabase(supabase)
  }, [supabase, user])

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