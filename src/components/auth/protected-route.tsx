"use client"

import { useAuth } from './auth-provider'
import { AuthModal } from './auth-modal'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Waves, Mic, BarChart3, Building2, Zap, Shield, Cloud, Users, Music } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

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
        <div className="min-h-screen bg-background">
          {/* Animated background */}
          <div className="fixed inset-0 animated-gradient opacity-5 -z-10" />
          
          {/* Header */}
          <header className="glass-card border-b border-white/10">
            <div className="container mx-auto px-4 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="icon-container p-3 rounded-xl">
                  <Waves className="h-8 w-8 icon-text" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Vibe Finder
                  </h1>
                  <p className="text-sm text-muted-foreground">Find Your Space's Vibe</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAuthMode('signin')
                    setShowAuthModal(true)
                  }}
                  className="glass border-white/20"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    setAuthMode('signup')
                    setShowAuthModal(true)
                  }}
                  className="gradient-primary text-white"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <main className="container mx-auto px-4 py-16">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Detect Building Resonance
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Professional acoustic analysis tool for detecting and analyzing building resonance frequencies. 
                Identify structural vibrations, HVAC issues, and acoustic problems with precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => {
                    setAuthMode('signup')
                    setShowAuthModal(true)
                  }}
                  className="gradient-primary text-white font-semibold px-8 py-4 text-lg"
                >
                  Start Analyzing
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setAuthMode('signin')
                    setShowAuthModal(true)
                  }}
                  className="glass border-white/20 px-8 py-4 text-lg"
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="glass-card rounded-2xl p-8 hover-lift soft-shadow text-center">
                <div className="icon-container p-4 rounded-2xl mx-auto mb-4 w-fit">
                  <Mic className="h-8 w-8 icon-text" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-time Recording</h3>
                <p className="text-muted-foreground">
                  Record audio samples with multiple sound types including sine waves, pink noise, and chirp signals for comprehensive analysis.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 hover-lift soft-shadow text-center">
                <div className="icon-container p-4 rounded-2xl mx-auto mb-4 w-fit">
                  <BarChart3 className="h-8 w-8 icon-text" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Frequency Analysis</h3>
                <p className="text-muted-foreground">
                  Advanced spectral analysis with peak detection, harmonic identification, and signal quality assessment.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 hover-lift soft-shadow text-center">
                <div className="icon-container p-4 rounded-2xl mx-auto mb-4 w-fit">
                  <Building2 className="h-8 w-8 icon-text" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Space Management</h3>
                <p className="text-muted-foreground">
                  Organize recordings by location and space type. Track multiple buildings and rooms with detailed metadata.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 hover-lift soft-shadow text-center">
                <div className="icon-container p-4 rounded-2xl mx-auto mb-4 w-fit">
                  <Zap className="h-8 w-8 icon-text" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Results</h3>
                <p className="text-muted-foreground">
                  Get immediate feedback on signal quality, dominant frequencies, and potential resonance issues.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 hover-lift soft-shadow text-center">
                <div className="icon-container p-4 rounded-2xl mx-auto mb-4 w-fit">
                  <Cloud className="h-8 w-8 icon-text" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Cloud Storage</h3>
                <p className="text-muted-foreground">
                  Securely store recordings and analysis data in the cloud. Access your data from any device, anywhere.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 hover-lift soft-shadow text-center">
                <div className="icon-container p-4 rounded-2xl mx-auto mb-4 w-fit">
                  <Shield className="h-8 w-8 icon-text" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your acoustic data is protected with enterprise-grade security. Only you can access your recordings and analysis.
                </p>
              </div>
            </div>

            {/* How It Works */}
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-12 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                How It Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="glass-card rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold gradient-primary text-white">
                    1
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Create a Space</h4>
                  <p className="text-muted-foreground">
                    Define the building or room you want to analyze with details about the space type and environment.
                  </p>
                </div>
                <div className="text-center">
                  <div className="glass-card rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold gradient-accent text-white">
                    2
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Record Audio</h4>
                  <p className="text-muted-foreground">
                    Use your device's microphone to capture acoustic samples with various test signals or ambient sound.
                  </p>
                </div>
                <div className="text-center">
                  <div className="glass-card rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold gradient-secondary text-white">
                    3
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Analyze Results</h4>
                  <p className="text-muted-foreground">
                    Review frequency analysis, identify resonance peaks, and get actionable insights about acoustic issues.
                  </p>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="glass-card rounded-2xl p-12 text-center">
              <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Perfect For
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div className="flex flex-col items-center">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <span className="font-medium">Building Engineers</span>
                </div>
                <div className="flex flex-col items-center">
                  <Music className="h-8 w-8 text-primary mb-2" />
                  <span className="font-medium">Musicians</span>
                </div>
                <div className="flex flex-col items-center">
                  <Mic className="h-8 w-8 text-primary mb-2" />
                  <span className="font-medium">Acoustic Consultants</span>
                </div>
                <div className="flex flex-col items-center">
                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                  <span className="font-medium">Researchers</span>
                </div>
              </div>
            </div>
          </main>
        </div>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />
      </>
    )
  }

  return <>{children}</>
}