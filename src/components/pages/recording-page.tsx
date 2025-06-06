"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer'
import { LevelMeter } from '@/components/ui/level-meter'
import { RecordingControls } from '@/components/ui/recording-controls'
import { Mic, ArrowLeft, AlertCircle, CheckCircle, Clock, Building2 } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder'
import { useSpaces } from '@/lib/hooks/use-database'
import { SoundType, SignalQuality } from '@/lib/types'
import { formatDuration, getSoundTypeLabel } from '@/lib/utils/space-utils'

export function RecordingPage() {
  const { setCurrentPage, navigationState } = useNavigation()
  const { spaces } = useSpaces()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(navigationState.selectedSpaceId || '')
  const [selectedSoundType, setSelectedSoundType] = useState<SoundType>(SoundType.AMBIENT)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    isInitialized,
    isPermissionGranted,
    recordingState,
    analysis,
    initialize,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveRecording,
    canRecord,
    canPause,
    canResume,
    canStop,
  } = useAudioRecorder({
    config: {
      sampleRate: 48000,
      channelCount: 1,
      maxDuration: 300, // 5 minutes
      minDuration: 1, // 1 second
    },
  })

  // Auto-select first space if none selected
  useEffect(() => {
    if (!selectedSpaceId && spaces.length > 0) {
      setSelectedSpaceId(spaces[0].id)
    }
  }, [selectedSpaceId, spaces])

  const handleStartRecording = async () => {
    if (!selectedSpaceId) {
      alert('Please select a space first')
      return
    }

    try {
      await startRecording()
      setRecordingBlob(null)
      setSaveSuccess(false)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Please check your microphone permissions.')
    }
  }

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording()
      setRecordingBlob(blob)
    } catch (error) {
      console.error('Failed to stop recording:', error)
      alert('Failed to stop recording.')
    }
  }

  const handleSaveRecording = async () => {
    if (!recordingBlob || !selectedSpaceId) return

    setIsSaving(true)
    try {
      await saveRecording(
        recordingBlob,
        selectedSpaceId,
        selectedSoundType,
        analysis?.signalQuality as SignalQuality
      )
      setSaveSuccess(true)
      setRecordingBlob(null)
      
      // Auto-navigate back after successful save
      setTimeout(() => {
        setCurrentPage('spaces')
      }, 2000)
    } catch (error) {
      console.error('Failed to save recording:', error)
      alert('Failed to save recording.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedSpace = spaces.find(space => space.id === selectedSpaceId)

  // Permission request UI
  if (isPermissionGranted === false) {
    return (
      <div className="min-h-screen bg-background">
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
              <Mic className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Recording</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="p-6 bg-orange-100 dark:bg-orange-900/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Microphone Access Required</h2>
            <p className="text-muted-foreground mb-6">
              This app needs access to your microphone to record audio samples for resonance analysis.
            </p>
            <Button onClick={initialize} size="lg">
              Grant Microphone Access
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Loading UI
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
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
              <Mic className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Recording</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="animate-pulse">
              <div className="p-6 bg-primary/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Mic className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Initializing Audio System</h2>
              <p className="text-muted-foreground">
                Setting up microphone and audio processing...
              </p>
            </div>
          </div>
        </main>
      </div>
    )
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
              onClick={() => setCurrentPage('home')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Mic className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Recording</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Recording saved successfully! Redirecting to spaces...
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {recordingState.error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200">
                {recordingState.error}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Space Selection */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recording Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Space</label>
                  <select
                    value={selectedSpaceId}
                    onChange={(e) => setSelectedSpaceId(e.target.value)}
                    disabled={recordingState.isRecording || recordingState.isPaused}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a space...</option>
                    {spaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))}
                  </select>
                  {selectedSpace && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{selectedSpace.description || 'No description'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sound Type</label>
                  <select
                    value={selectedSoundType}
                    onChange={(e) => setSelectedSoundType(e.target.value as SoundType)}
                    disabled={recordingState.isRecording || recordingState.isPaused}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.values(SoundType).map((type) => (
                      <option key={type} value={type}>
                        {getSoundTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Recording Status */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recording Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duration</span>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-lg">
                      {formatDuration(recordingState.duration)}
                    </span>
                  </div>
                </div>

                {analysis && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Signal Quality</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analysis.signalQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                        analysis.signalQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                        analysis.signalQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {analysis.signalQuality.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Dominant Frequency</span>
                      <span className="font-mono">
                        {analysis.frequency.toFixed(1)} Hz
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Controls</h3>
              
              <RecordingControls
                canRecord={canRecord && !!selectedSpaceId}
                canPause={canPause}
                canResume={canResume}
                canStop={canStop}
                canSave={!!recordingBlob && !isSaving}
                isRecording={recordingState.isRecording}
                isPaused={recordingState.isPaused}
                onStart={handleStartRecording}
                onPause={pauseRecording}
                onResume={resumeRecording}
                onStop={handleStopRecording}
                onSave={handleSaveRecording}
                disabled={isSaving}
              />

              {!selectedSpaceId && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Select a space to start recording
                </p>
              )}

              {recordingBlob && (
                <p className="text-sm text-green-600 text-center mt-4">
                  Recording ready to save!
                </p>
              )}

              {isSaving && (
                <p className="text-sm text-blue-600 text-center mt-4">
                  Saving recording...
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Visualizations */}
          <div className="space-y-6">
            {/* Waveform */}
            <WaveformVisualizer
              level={recordingState.level}
              isRecording={recordingState.isRecording}
            />

            {/* Level Meter */}
            <LevelMeter
              level={recordingState.level}
              peak={analysis?.peak || 0}
            />

            {/* Analysis Display */}
            {analysis && (
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Real-time Analysis</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(analysis.rms * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">RMS Level</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(analysis.peak * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Peak Level</div>
                  </div>
                  
                  <div className="text-center col-span-2">
                    <div className="text-xl font-bold text-primary">
                      {analysis.frequency.toFixed(1)} Hz
                    </div>
                    <div className="text-sm text-muted-foreground">Dominant Frequency</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}