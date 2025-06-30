"use client"

import { useState, useEffect } from 'react'
import { getEnvironmentInfo } from '@/lib/supabase/client'
import { AlertTriangle, Database, CheckCircle } from 'lucide-react'

export function EnvironmentIndicator() {
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const info = getEnvironmentInfo()
    setEnvInfo(info)
    
    // Only show in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 shadow-lg">
        <div className="flex items-start gap-2">
          <Database className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Development Mode
              </span>
              {envInfo?.hasAnonKey ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <div>Environment: {envInfo?.environment}</div>
              <div>Database: {envInfo?.supabaseUrl}</div>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}