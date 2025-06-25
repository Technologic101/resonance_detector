"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 hover:bg-white/10"
      >
        <div className="icon-container p-2 rounded-lg">
          <User className="h-4 w-4 icon-text" />
        </div>
        <span className="hidden sm:block text-sm font-medium">
          {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 glass-card border border-white/20 rounded-xl shadow-xl py-2 z-20 min-w-[200px]">
            <div className="px-4 py-2 border-b border-white/10">
              <p className="text-sm font-medium">{user.user_metadata?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            
            <button
              onClick={() => {
                setIsOpen(false)
                // TODO: Navigate to settings
              }}
              className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 text-sm transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 text-red-400 text-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}