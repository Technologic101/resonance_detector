"use client"

import { useAuth } from './auth-provider'
import { AuthModal } from './auth-modal'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Waves, Lock } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Waves className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="icon-container p-6 rounded-2xl mx-auto mb-6 w-fit">
              <Lock className="h-12 w-12 icon-text" />
            </div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Authentication Required
            </h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access the Building Resonance Detector and save your acoustic analysis data.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setShowAuthModal(true)}
                className="w-full gradient-primary text-white font-semibold"
              >
                Sign In
              </Button>
              <p className="text-sm text-muted-foreground">
                New user? The sign-in form also allows you to create an account.
              </p>
            </div>
          </div>
        </div>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    )
  }

  return <>{children}</>
}