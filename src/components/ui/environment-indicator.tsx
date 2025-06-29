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
    
    // Only show in development
    if (info.isDevelopment) {
      setIsVisible(true)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  if (!envInfo?.isDevelopment || !isVisible) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 shadow-lg">
        <div className="flex items-start gap-2">
          <Database className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Development Mode
              </span>
              {envInfo.hasAnonKey ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <div>Environment: {envInfo.environment}</div>
              <div>Database: {envInfo.supabaseUrl}</div>
              <div className="text-xs opacity-75">
                Using {envInfo.isDevelopment ? 'development' : 'production'} database
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}