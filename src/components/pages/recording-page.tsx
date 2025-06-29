"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer'
import { LevelMeter } from '@/components/ui/level-meter'
import { RecordingControls } from '@/components/ui/recording-controls'
import { InfoTooltip } from '@/components/ui/tooltip'
import { Mic, ArrowLeft, AlertCircle, CheckCircle, Clock, Building2, Activity, Zap } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { useAuth } from '@/components/auth/auth-provider'
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder'
import { useSpaces } from '@/lib/hooks/use-database'
import { SoundType, SignalQuality } from '@/lib/types'
import { formatDuration, getSoundTypeLabel } from '@/lib/utils/space-utils'

export function RecordingPage() {
  const { setCurrentPage, navigationState } = useNavigation()
  const { user } = useAuth()
  const { spaces } = useSpaces()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(navigationState.selectedSpaceId || '')
  const [selectedSoundType, setSelectedSoundType] = useState<SoundType>(SoundType.AMBIENT)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    getAudioNodes,
    canRecord,
    canPause,
    canResume,
    canStop,
  } = useAudioRecorder({
    config: {
      sampleRate: 48000,
      channelCount: 1,
      maxDuration: 300, // 5 minutes default
      minDuration: 1, // 1 second
      enableEchoCancellation: false,
      enableNoiseSuppression: false,
      enableAutoGainControl: false,
    },
    user,
  })

  // Get audio nodes for visualization
  const { audioContext, analyserNode } = getAudioNodes()

  // Auto-select first space if none selected
  useEffect(() => {
    if (!selectedSpaceId && spaces.length > 0) {
      setSelectedSpaceId(spaces[0].id)
    }
  }, [selectedSpaceId, spaces])

  // Get max duration based on sound type and actual audio file duration
  const getMaxDurationForSoundType = (soundType: SoundType): number => {
    if (soundType === SoundType.AMBIENT) {
      return 20 // 20 seconds for ambient recordings
    }
    return 300 // 5 minutes for other types (will be overridden by actual WAV duration)
  }

  // Get the actual max duration for the current recording
  const getActualMaxDuration = (): number => {
    if (selectedSoundType === SoundType.AMBIENT) {
      return 20
    }
    // For WAV files, get the actual audio duration from the recorder
    const recorderInstance = (window as any).audioRecorderInstance
    if (recorderInstance && typeof recorderInstance.getCurrentAudioDuration === 'function') {
      const audioDuration = recorderInstance.getCurrentAudioDuration()
      if (audioDuration > 0) {
        return audioDuration + 0.5 // Add small buffer
      }
    }
    return getMaxDurationForSoundType(selectedSoundType)
  }

  const maxDuration = getActualMaxDuration()

  const handleStartRecording = async () => {
    if (!selectedSpaceId) {
      alert('Please select a space first')
      return
    }

    try {
      // Clear any previous recording blob
      setRecordingBlob(null)
      setSaveSuccess(false)
      setSaveError(null)
      
      await startRecording(selectedSoundType)
      console.log('Recording started successfully')
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Please check your microphone permissions.')
    }
  }

  const handleStopRecording = async () => {
    try {
      console.log('Attempting to stop recording...')
      const blob = await stopRecording()
      console.log('Recording stopped successfully, blob size:', blob.size)
      
      if (blob.size === 0) {
        throw new Error('Recording is empty')
      }
      
      setRecordingBlob(blob)
      console.log('Recording blob set in state, size:', blob.size)
    } catch (error) {
      console.error('Failed to stop recording:', error)
      alert(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSaveRecording = async () => {
    if (!recordingBlob || !selectedSpaceId) {
      console.error('Cannot save: missing blob or space ID', { 
        hasBlob: !!recordingBlob, 
        blobSize: recordingBlob?.size,
        spaceId: selectedSpaceId 
      })
      return
    }

    if (!user) {
      console.error('Cannot save: user not authenticated')
      setSaveError('User not authenticated. Please log in again.')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    
    try {
      console.log('Starting save process...', {
        blobSize: recordingBlob.size,
        spaceId: selectedSpaceId,
        soundType: selectedSoundType,
        duration: recordingState.duration
      })

      await saveRecording(
        recordingBlob,
        selectedSpaceId,
        selectedSoundType,
        analysis?.signalQuality as SignalQuality
      )
      
      console.log('Recording saved successfully')
      setSaveSuccess(true)
      setRecordingBlob(null)
      
      // Auto-navigate back after successful save
      setTimeout(() => {
        setCurrentPage('spaces')
      }, 2000)
    } catch (error) {
      console.error('Failed to save recording:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setSaveError(`Failed to save recording: ${errorMessage}`)
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
      <main className="container mx-auto px-4 py-6 max-w-6xl">
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

        {/* Error Messages */}
        {(recordingState.error || saveError) && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200">
                {recordingState.error || saveError}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Recording Settings */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Recording Settings</h3>
                <InfoTooltip 
                  content="Configure your recording parameters including the space to analyze and the type of test signal to use."
                  side="right"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="block text-sm font-medium">Space</label>
                    <InfoTooltip 
                      content="Select the acoustic space you want to analyze. Each space can have multiple recordings for comparison."
                      side="top"
                    />
                  </div>
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
                  <div className="flex items-center gap-1 mb-2">
                    <label className="block text-sm font-medium">Sound Type</label>
                    <InfoTooltip 
                      content="Choose the type of test signal: Ambient (natural room sound), Sweeps (frequency analysis), or Noise (broadband testing). Each type reveals different acoustic properties."
                      side="top"
                    />
                  </div>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSoundType === SoundType.AMBIENT 
                      ? `Record ambient room sound (max ${getMaxDurationForSoundType(selectedSoundType)} seconds)`
                      : 'The selected test signal will play when recording starts'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Recording Status */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Recording Status</h3>
                <InfoTooltip 
                  content="Real-time information about your current recording including duration, signal quality, and frequency analysis."
                  side="right"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Duration</span>
                    <InfoTooltip 
                      content="Current recording length. Longer recordings may capture more frequency information, but each sound type has optimal durations."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-lg">
                      {formatDuration(recordingState.duration)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {formatDuration(maxDuration)}
                    </span>
                  </div>
                </div>

                {/* Duration progress bar for all recording types */}
                {(recordingState.isRecording || recordingState.isPaused) && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((recordingState.duration / maxDuration) * 100, 100)}%` }}
                    />
                  </div>
                )}

                {analysis && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">Signal Quality</span>
                        <InfoTooltip 
                          content="Overall recording quality based on signal strength, noise levels, and frequency content. Higher quality provides more accurate analysis."
                          side="top"
                        />
                      </div>
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
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">Dominant Frequency</span>
                        <InfoTooltip 
                          content="The strongest frequency detected in real-time. This may indicate the primary resonance of the space."
                          side="top"
                        />
                      </div>
                      <span className="font-mono">
                        {analysis.frequency.toFixed(1)} Hz
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">SNR</span>
                        <InfoTooltip 
                          content="Signal-to-Noise Ratio in decibels. Higher values indicate cleaner recordings with less background interference."
                          side="top"
                        />
                      </div>
                      <span className="font-mono">
                        {isFinite(analysis.frequencyAnalysis.snr) 
                          ? `${analysis.frequencyAnalysis.snr.toFixed(1)} dB`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Controls</h3>
                <InfoTooltip 
                  content="Start, pause, resume, stop, and save your recordings. Make sure to select a space before starting."
                  side="right"
                />
              </div>
              
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
                <div className="text-center mt-4">
                  <p className="text-sm text-green-600 font-medium">
                    Recording ready to save! ({(recordingBlob.size / 1024).toFixed(1)} KB)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {formatDuration(recordingState.duration || 0)}
                  </p>
                </div>
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
              audioContext={audioContext}
              analyserNode={analyserNode}
            />

            {/* Level Meter */}
            <LevelMeter
              level={recordingState.level}
              peak={analysis?.peak || 0}
              rms={analysis?.rms || 0}
            />

            {/* Real-time Analysis */}
            {analysis && (
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Real-time Analysis</h3>
                  <InfoTooltip 
                    content="Live analysis of your recording showing signal levels, frequency content, and advanced acoustic metrics as you record."
                    side="right"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(analysis.rms * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      RMS Level
                      <InfoTooltip 
                        content="Root Mean Square - average signal level over time. Indicates overall recording volume."
                        side="top"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(analysis.peak * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      Peak Level
                      <InfoTooltip 
                        content="Highest signal level detected. Helps avoid clipping and ensures good recording quality."
                        side="top"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">
                      {analysis.frequency.toFixed(1)} Hz
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      Dominant Freq
                      <InfoTooltip 
                        content="The strongest frequency currently being detected in the recording."
                        side="top"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">
                      {analysis.frequencyAnalysis.peaks.length}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      Peaks Found
                      <InfoTooltip 
                        content="Number of significant frequency peaks detected. More peaks may indicate complex acoustic behavior."
                        side="top"
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Metrics */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Advanced Metrics
                    <InfoTooltip 
                      content="Detailed acoustic analysis metrics for professional assessment of recording quality and acoustic properties."
                      side="right"
                      className="ml-2"
                    />
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Spectral Centroid:</span>
                        <InfoTooltip 
                          content="The 'center of mass' of the frequency spectrum. Higher values indicate brighter, more high-frequency content."
                          side="top"
                        />
                      </div>
                      <span className="font-mono">{analysis.metrics.spectralCentroid.toFixed(0)} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Zero Crossings:</span>
                        <InfoTooltip 
                          content="Rate at which the signal crosses zero amplitude. Higher rates typically indicate more high-frequency content."
                          side="top"
                        />
                      </div>
                      <span className="font-mono">{(analysis.metrics.zeroCrossingRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">THD:</span>
                        <InfoTooltip 
                          content="Total Harmonic Distortion - measures signal purity. Lower values indicate cleaner recordings."
                          side="top"
                        />
                      </div>
                      <span className="font-mono">{analysis.frequencyAnalysis.thd.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Fundamental:</span>
                        <InfoTooltip 
                          content="The lowest, most prominent frequency in the signal. Often indicates the primary resonance."
                          side="top"
                        />
                      </div>
                      <span className="font-mono">{analysis.frequencyAnalysis.fundamentalFrequency.toFixed(1)} Hz</span>
                    </div>
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