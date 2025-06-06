import { useState, useEffect, useCallback, useRef } from 'react'
import { AudioRecorder, RecordingState, AudioAnalysis, AudioRecorderConfig } from '@/lib/audio/audio-recorder'
import { AudioStorage } from '@/lib/audio/audio-storage'
import { SoundType, SignalQuality } from '@/lib/types'

export interface UseAudioRecorderOptions {
  config?: AudioRecorderConfig
  autoSave?: boolean
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    level: 0,
    error: null,
  })
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null)
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null)
  
  const recorderRef = useRef<AudioRecorder | null>(null)
  const { config = {}, autoSave = true } = options

  // Initialize recorder
  const initialize = useCallback(async () => {
    try {
      if (recorderRef.current) {
        recorderRef.current.dispose()
      }

      const recorder = new AudioRecorder(
        config,
        setRecordingState,
        setAnalysis
      )

      await recorder.initialize()
      recorderRef.current = recorder
      setIsInitialized(true)
      setIsPermissionGranted(true)
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error)
      setRecordingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize recorder',
      }))
      setIsPermissionGranted(false)
    }
  }, [config])

  // Check microphone permission
  const checkPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      setIsPermissionGranted(result.state === 'granted')
      
      result.addEventListener('change', () => {
        setIsPermissionGranted(result.state === 'granted')
      })
    } catch (error) {
      // Fallback: try to access microphone directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        setIsPermissionGranted(true)
      } catch {
        setIsPermissionGranted(false)
      }
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    if (!recorderRef.current) {
      throw new Error('Recorder not initialized')
    }

    try {
      await recorderRef.current.startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }, [])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!recorderRef.current) return
    recorderRef.current.pauseRecording()
  }, [])

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!recorderRef.current) return
    recorderRef.current.resumeRecording()
  }, [])

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) {
      throw new Error('Recorder not initialized')
    }

    try {
      const blob = await recorderRef.current.stopRecording()
      return blob
    } catch (error) {
      console.error('Failed to stop recording:', error)
      throw error
    }
  }, [])

  // Save recording
  const saveRecording = useCallback(async (
    blob: Blob,
    spaceId: string,
    soundType: SoundType = SoundType.AMBIENT,
    signalQuality?: SignalQuality
  ) => {
    try {
      const duration = recordingState.duration
      const quality = signalQuality || (analysis?.signalQuality as SignalQuality) || SignalQuality.GOOD
      
      const analysisData = analysis ? {
        ambientNoise: analysis.rms * 100,
        peaks: analysis.frequencyAnalysis.peaks,
        spectralData: {
          rms: analysis.rms,
          peak: analysis.peak,
          dominantFrequency: analysis.frequency,
          spectralCentroid: analysis.metrics.spectralCentroid,
          spectralRolloff: analysis.metrics.spectralRolloff,
          zeroCrossingRate: analysis.metrics.zeroCrossingRate,
          mfcc: analysis.metrics.mfcc,
          snr: analysis.frequencyAnalysis.snr,
          thd: analysis.frequencyAnalysis.thd,
          fundamentalFrequency: analysis.frequencyAnalysis.fundamentalFrequency,
          harmonics: analysis.frequencyAnalysis.harmonics,
        },
      } : undefined

      const sampleId = await AudioStorage.saveAudioFile(
        blob,
        spaceId,
        soundType,
        duration,
        quality,
        analysisData
      )

      return sampleId
    } catch (error) {
      console.error('Failed to save recording:', error)
      throw error
    }
  }, [recordingState.duration, analysis])

  // Get storage info
  const getStorageInfo = useCallback(async () => {
    return await AudioStorage.getStorageUsage()
  }, [])

  // Get audio context and analyser for visualizations
  const getAudioNodes = useCallback(() => {
    if (!recorderRef.current) return { audioContext: null, analyserNode: null }
    
    const audioContext = recorderRef.current.getAudioContext()
    const analyserNode = recorderRef.current['processor']?.getAnalyser() || null
    
    return { audioContext, analyserNode }
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.dispose()
      recorderRef.current = null
    }
    setIsInitialized(false)
  }, [])

  // Initialize on mount
  useEffect(() => {
    checkPermission()
    
    return () => {
      cleanup()
    }
  }, [checkPermission, cleanup])

  // Auto-initialize when permission is granted
  useEffect(() => {
    if (isPermissionGranted && !isInitialized) {
      initialize()
    }
  }, [isPermissionGranted, isInitialized, initialize])

  return {
    // State
    isInitialized,
    isPermissionGranted,
    recordingState,
    analysis,
    
    // Actions
    initialize,
    checkPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveRecording,
    getStorageInfo,
    getAudioNodes,
    cleanup,
    
    // Computed
    canRecord: isInitialized && isPermissionGranted && !recordingState.isRecording,
    canPause: isInitialized && recordingState.isRecording && !recordingState.isPaused,
    canResume: isInitialized && recordingState.isPaused,
    canStop: isInitialized && (recordingState.isRecording || recordingState.isPaused),
  }
}