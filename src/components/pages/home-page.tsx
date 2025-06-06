"use client"

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Waves, Mic, BarChart3, Settings, Plus } from 'lucide-react'

export function HomePage() {
  const handleNewRecording = () => {
    // TODO: Navigate to recording page
    alert('Recording feature will be implemented in the next phase')
  }

  const handleViewAnalysis = () => {
    // TODO: Navigate to analysis page
    alert('Analysis feature will be implemented in the next phase')
  }

  const handleNewSpace = () => {
    // TODO: Navigate to create space page
    alert('Space creation feature will be implemented in the next phase')
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
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">0</div>
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
                <div className="text-2xl font-bold text-secondary-foreground">0</div>
                <div className="text-sm text-muted-foreground">Samples</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="bg-card rounded-lg border p-8 text-center">
            <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No recordings yet</h4>
            <p className="text-muted-foreground mb-4">
              Create a space and start recording to see activity here
            </p>
          </div>
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
              <Waves className="h-5 w-5 mb-1" />
              <span className="text-xs">Home</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
              <BarChart3 className="h-5 w-5 mb-1" />
              <span className="text-xs">Spaces</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
              <Mic className="h-5 w-5 mb-1" />
              <span className="text-xs">Record</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
              <BarChart3 className="h-5 w-5 mb-1" />
              <span className="text-xs">Analysis</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  )
}