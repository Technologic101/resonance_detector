"use client"

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ArrowLeft, Building2, Mic, Calendar, Edit, Trash2 } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { useSamples } from '@/lib/hooks/use-database'
import { Space } from '@/lib/types'
import { getSpaceTypeLabel, formatDate, formatDateTime, getSoundTypeLabel, getSignalQualityBgColor } from '@/lib/utils/space-utils'

interface SpaceDetailsViewProps {
  space: Space
  onUpdate: () => void
}

export function SpaceDetailsView({ space, onUpdate }: SpaceDetailsViewProps) {
  const { goBack, navigateToRecording } = useNavigation()
  const { samples, loading: samplesLoading } = useSamples(space.id)

  const handleRecord = () => {
    navigateToRecording(space.id)
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
              onClick={goBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">{space.name}</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Space Info */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">{space.name}</h2>
              <p className="text-primary font-medium mb-2">{getSpaceTypeLabel(space.type)}</p>
              {space.description && (
                <p className="text-muted-foreground">{space.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created</span>
              <div className="font-medium">{formatDate(space.createdAt)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated</span>
              <div className="font-medium">{formatDate(space.updatedAt)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Recordings</span>
              <div className="font-medium">{space.sampleIds.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Frequencies</span>
              <div className="font-medium">{space.analyzedFrequencies.length}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button onClick={handleRecord} className="h-16">
            <Mic className="h-5 w-5 mr-2" />
            Start Recording
          </Button>
          <Button variant="outline" className="h-16">
            <Calendar className="h-5 w-5 mr-2" />
            View Analysis
          </Button>
        </div>

        {/* Recordings */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recordings</h3>
            <Button variant="outline" size="sm" onClick={handleRecord}>
              <Mic className="h-4 w-4 mr-2" />
              New Recording
            </Button>
          </div>

          {samplesLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading recordings...</div>
            </div>
          ) : samples.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No recordings yet</h4>
              <p className="text-muted-foreground mb-4">
                Start recording to analyze the acoustic properties of this space
              </p>
              <Button onClick={handleRecord}>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {samples.map((sample) => (
                <div key={sample.id} className="border rounded-lg p-4">
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
      </main>
    </div>
  )
}