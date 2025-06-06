"use client"

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { BarChart3, ArrowLeft } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'

export function AnalysisPage() {
  const { setCurrentPage } = useNavigation()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('home')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Analysis</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="p-6 bg-orange-100 dark:bg-orange-900/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <BarChart3 className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Analysis Feature</h2>
          <p className="text-lg text-muted-foreground mb-2">Coming in Phase 4</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            This will include FFT analysis, frequency peak detection, spectrograms, 
            and building resonance interpretation with interactive charts.
          </p>
        </div>
      </main>
    </div>
  )
}