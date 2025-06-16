"use client"

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Waves, Mic, BarChart3, Settings, Plus, Building2 } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { useStats, useRecentSamples } from '@/lib/hooks/use-database'
import { formatDateTime, getSoundTypeLabel, getSignalQualityBgColor } from '@/lib/utils/space-utils'
import { useEffect } from 'react'

export function HomePage() {
  const { navigateToRecording, navigateToCreateSpace, setCurrentPage } = useNavigation()
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useStats()
  const { samples: recentSamples, loading: samplesLoading, error: samplesError, refetch: refetchSamples } = useRecentSamples(3)

  // Ensure stats are loaded correctly on first render
  useEffect(() => {
    // Refetch stats after a short delay to ensure database is ready
    const timer = setTimeout(() => {
      refetchStats()
      refetchSamples()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [refetchStats, refetchSamples])

  const handleNewRecording = () => {
    navigateToRecording()
  }

  const handleViewAnalysis = () => {
    setCurrentPage('analysis')
  }

  const handleNewSpace = () => {
    navigateToCreateSpace()
  }

  // Retry loading stats if there was an error
  const handleRetryStats = () => {
    refetchStats()
    refetchSamples()
  }

  return (
    <div className="min-h-screen">
      {/* Animated background */}
      <div className="fixed inset-0 animated-gradient opacity-5 -z-10" />
      
      {/* Header */}
      <header className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="icon-container p-3 rounded-xl">
              <Waves className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Building Resonance
              </h1>
              <p className="text-sm text-muted-foreground">Acoustic Analysis Platform</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Welcome Heading - Centered on Background */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to Resonance Detection
          </h2>
          <p className="text-muted-foreground text-xl">
            Analyze building acoustics and structural frequencies with precision
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 hover-lift soft-shadow">
            <div className="flex items-center justify-between">
              <div className="icon-container p-3 rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 h-8 w-12 rounded"></div>
                  ) : statsError ? (
                    <button 
                      onClick={handleRetryStats}
                      className="text-red-500 hover:text-red-600 text-sm transition-colors"
                      title="Click to retry"
                    >
                      Error
                    </button>
                  ) : (
                    stats.spaceCount
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Spaces</div>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-2xl p-6 hover-lift soft-shadow">
            <div className="flex items-center justify-between">
              <div className="icon-container p-3 rounded-xl">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold gradient-accent bg-clip-text text-transparent">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 h-8 w-12 rounded"></div>
                  ) : statsError ? (
                    <button 
                      onClick={handleRetryStats}
                      className="text-red-500 hover:text-red-600 text-sm transition-colors"
                      title="Click to retry"
                    >
                      Error
                    </button>
                  ) : (
                    stats.sampleCount
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Samples</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Recent Activity
            </h3>
            {recentSamples.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentPage('analysis')}
                className="hover:bg-white/10 transition-all duration-300"
              >
                View All
              </Button>
            )}
          </div>
          
          {samplesLoading ? (
            <div className="glass-card rounded-2xl p-8 text-center soft-shadow">
              <div className="animate-pulse text-muted-foreground">Loading recent activity...</div>
            </div>
          ) : samplesError ? (
            <div className="glass-card rounded-2xl p-8 text-center soft-shadow">
              <div className="text-red-500 mb-4">Failed to load recent activity</div>
              <Button variant="outline" onClick={handleRetryStats} className="glass border-white/20">
                Retry
              </Button>
            </div>
          ) : recentSamples.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center soft-shadow">
              <div className="icon-container p-4 rounded-2xl mx-auto mb-4 w-fit">
                <Mic className="h-12 w-12 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">No recordings yet</h4>
              <p className="text-muted-foreground mb-4">
                Create a space and start recording to see activity here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSamples.map((sample) => (
                <div key={sample.id} className="glass-card rounded-xl p-4 hover-lift soft-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="icon-container p-2 rounded-lg">
                        <Mic className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">{getSoundTypeLabel(sample.soundType)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(sample.recordedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground font-medium">
                        {sample.duration.toFixed(1)}s
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSignalQualityBgColor(sample.signalQuality)} border border-white/20`}>
                        {sample.signalQuality.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleNewRecording}
              className="glass-card rounded-2xl p-8 hover-lift soft-shadow transition-all duration-300 text-left w-full group"
            >
              <div className="flex items-center space-x-6">
                <div className="icon-container p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">New Recording</h4>
                  <p className="text-muted-foreground">Start measuring resonance</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={handleViewAnalysis}
              className="glass-card rounded-2xl p-8 hover-lift soft-shadow transition-all duration-300 text-left w-full group"
            >
              <div className="flex items-center space-x-6">
                <div className="icon-container p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">View Analysis</h4>
                  <p className="text-muted-foreground">Review frequency data</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Action Button - Removed glow-pulse */}
      <div className="fixed bottom-24 right-6">
        <Button 
          size="lg" 
          className="rounded-full shadow-2xl gradient-primary border-0 text-white font-semibold px-6 py-3 hover:scale-105 transition-all duration-300" 
          onClick={handleNewSpace}
        >
          <Plus className="h-5 w-5 mr-2" />
          New Space
        </Button>
      </div>
    </div>
  )
}