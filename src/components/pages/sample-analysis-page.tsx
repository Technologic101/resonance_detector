"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ArrowLeft, BarChart3, Building2 } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { useSamples, useSpace } from '@/lib/hooks/use-database'
import { SampleDetailView } from '@/components/ui/sample-detail-view'
import { RoomModeCalculator } from '@/components/ui/room-mode-calculator'

export function SampleAnalysisPage() {
  const { setCurrentPage, navigationState } = useNavigation()
  const { samples, loading: samplesLoading } = useSamples()
  const { space } = useSpace(navigationState.selectedSpaceId || null)
  const [showRoomCalculator, setShowRoomCalculator] = useState(false)
  
  // Get the selected sample
  const selectedSample = navigationState.selectedSampleId 
    ? samples.find(s => s.id === navigationState.selectedSampleId) 
    : null
  
  // Export analysis data as JSON
  const handleExportData = () => {
    if (!selectedSample) return
    
    const data = {
      id: selectedSample.id,
      recordedAt: selectedSample.recordedAt,
      duration: selectedSample.duration,
      soundType: selectedSample.soundType,
      signalQuality: selectedSample.signalQuality,
      peaks: selectedSample.peaks,
      spectralData: selectedSample.spectralData
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-${selectedSample.id.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('analysis')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Sample Analysis</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoomCalculator(!showRoomCalculator)}
            >
              {showRoomCalculator ? 'Hide Calculator' : 'Room Calculator'}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Space Info */}
        {space && (
          <div className="bg-card border rounded-lg p-4 mb-6 flex items-center">
            <Building2 className="h-5 w-5 text-primary mr-3" />
            <div>
              <div className="font-medium">{space.name}</div>
              <div className="text-sm text-muted-foreground">{space.description}</div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analysis */}
          <div className={showRoomCalculator ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {samplesLoading ? (
              <div className="bg-card border rounded-lg p-8 text-center">
                <div className="animate-pulse text-muted-foreground">Loading sample data...</div>
              </div>
            ) : !selectedSample ? (
              <div className="bg-card border rounded-lg p-8 text-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Sample Selected</h2>
                <p className="text-muted-foreground mb-4">
                  Return to the analysis page to select a sample for detailed analysis.
                </p>
                <Button onClick={() => setCurrentPage('analysis')}>
                  Go to Analysis
                </Button>
              </div>
            ) : (
              <SampleDetailView 
                sample={selectedSample} 
                onExport={handleExportData} 
              />
            )}
          </div>
          
          {/* Room Mode Calculator */}
          {showRoomCalculator && (
            <div className="lg:col-span-1">
              <RoomModeCalculator />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}