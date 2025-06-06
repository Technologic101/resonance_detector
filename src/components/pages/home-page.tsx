"use client"

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Waves, Mic, BarChart3, Settings, Plus, Building2 } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { useStats, useRecentSamples } from '@/lib/hooks/use-database'
import { formatDateTime, getSoundTypeLabel, getSignalQualityBgColor } from '@/lib/utils/space-utils'

export function HomePage() {
  const { navigateToRecording, navigateToCreateSpace, setCurrentPage } = useNavigation()
  const { stats, loading: statsLoading } = useStats()
  const { samples: recentSamples, loading: samplesLoading } = useRecentSamples(3)

  const handleNewRecording = () => {
    navigateToRecording()
  }

  const handleViewAnalysis = () => {
    setCurrentPage('analysis')
  }

  const handleNewSpace = () => {
    navigateToCreateSpace()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Building Resonance</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Welcome Section */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Waves className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Resonance Detection</h2>
              <p className="text-muted-foreground">
                Analyze building acoustics and structural frequencies with precision
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {statsLoading ? '...' : stats.spaceCount}
                </div>
                <div className="text-sm text-muted-foreground">Spaces</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Mic className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-secondary-foreground">
                  {statsLoading ? '...' : stats.sampleCount}
                </div>
                <div className="text-sm text-muted-foreground">Samples</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Recent Activity</h3>
            {recentSamples.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentPage('analysis')}
              >
                View All
              </Button>
            )}
          </div>
          
          {samplesLoading ? (
            <div className="bg-card rounded-lg border p-8 text-center">
              <div className="animate-pulse">Loading recent activity...</div>
            </div>
          ) : recentSamples.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No recordings yet</h4>
              <p className="text-muted-foreground mb-4">
                Create a space and start recording to see activity here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSamples.map((sample) => (
                <div key={sample.id} className="bg-card rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mic className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{getSoundTypeLabel(sample.soundType)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(sample.recordedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {sample.duration.toFixed(1)}s
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSignalQualityBgColor(sample.signalQuality)}`}>
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
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleNewRecording}
              className="bg-card rounded-lg border p-6 hover:bg-accent/50 transition-colors cursor-pointer text-left w-full"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">New Recording</h4>
                  <p className="text-sm text-muted-foreground">Start measuring resonance</p>
                </div>
              </div>
            </button>
            <button
              onClick={handleViewAnalysis}
              className="bg-card rounded-lg border p-6 hover:bg-accent/50 transition-colors cursor-pointer text-left w-full"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">View Analysis</h4>
                  <p className="text-sm text-muted-foreground">Review frequency data</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6">
        <Button size="lg" className="rounded-full shadow-lg" onClick={handleNewSpace}>
          <Plus className="h-5 w-5 mr-2" />
          New Space
        </Button>
      </div>
    </div>
  )
}