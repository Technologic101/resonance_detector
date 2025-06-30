import { useState, useEffect, useCallback, useRef } from 'react'
import { AudioRecorder, RecordingState, AudioAnalysis, AudioRecorderConfig } from '@/lib/audio/audio-recorder'
import { AudioStorage } from '@/lib/audio/audio-storage'
import { SoundType, SignalQuality } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import { useAuth } from '@/components/auth/auth-provider'

export interface UseAudioRecorderOptions {
  config?: AudioRecorderConfig
  autoSave?: boolean
  user?: User | null
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { user, supabase } = useAuth()
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
      console.log('Initializing audio recorder...')
      
      if (recorderRef.current) {
        recorderRef.current.dispose()
      }

      const recorder = new AudioRecorder(
        config,
        (state) => {
          console.log('Recording state changed:', state)
          setRecordingState(state)
        },
        (analysisData) => {
          console.log('Analysis updated:', analysisData)
          setAnalysis(analysisData)
        }
      )

      await recorder.initialize()
      recorderRef.current = recorder
      setIsInitialized(true)
      setIsPermissionGranted(true)
      console.log('Audio recorder initialized successfully')
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
      console.log('Checking microphone permission...')
      
      // Try to get user media directly as permission API is unreliable
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      })
      
      // Stop the stream immediately as we're just checking permission
      stream.getTracks().forEach(track => track.stop())
      setIsPermissionGranted(true)
      console.log('Microphone permission granted')
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setIsPermissionGranted(false)
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async (soundType: SoundType = SoundType.AMBIENT) => {
    console.log('Starting recording...')
    
    if (!recorderRef.current) {
      throw new Error('Recorder not initialized')
    }

    try {
      await recorderRef.current.startRecording(soundType)
      console.log('Recording started successfully')
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }, [])

  // Pause recording
  const pauseRecording = useCallback(() => {
    console.log('Pausing recording...')
    
    if (!recorderRef.current) {
      console.warn('No recorder available to pause')
      return
    }
    
    try {
      recorderRef.current.pauseRecording()
      console.log('Recording paused')
    } catch (error) {
      console.error('Failed to pause recording:', error)
    }
  }, [])

  // Resume recording
  const resumeRecording = useCallback(() => {
    console.log('Resuming recording...')
    
    if (!recorderRef.current) {
      console.warn('No recorder available to resume')
      return
    }
    
    try {
      recorderRef.current.resumeRecording()
      console.log('Recording resumed')
    } catch (error) {
      console.error('Failed to resume recording:', error)
    }
  }, [])

  // Stop recording
  const stopRecording = useCallback(async () => {
    console.log('Stopping recording...')
    
    if (!recorderRef.current) {
      throw new Error('Recorder not initialized')
    }

    try {
      const blob = await recorderRef.current.stopRecording()
      console.log('Recording stopped, blob size:', blob.size)
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
      console.log('Saving recording...', { 
        blobSize: blob.size, 
        spaceId, 
        soundType, 
        duration: recordingState.duration 
      })
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
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
        user,
        supabase,
        blob,
        spaceId,
        soundType,
        duration,
        quality,
        analysisData
      )

      console.log('Recording saved with ID:', sampleId)
      return sampleId
    } catch (error) {
      console.error('Failed to save recording:', error)
      throw error
    }
  }, [recordingState.duration, analysis, user, supabase])

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
    console.log('Cleaning up audio recorder...')
    
    if (recorderRef.current) {
      recorderRef.current.dispose()
      recorderRef.current = null
    }
    setIsInitialized(false)
    setAnalysis(null)
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      level: 0,
      error: null,
    })
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
    canRecord: isInitialized && isPermissionGranted && !recordingState.isRecording && !recordingState.isPaused,
    canPause: isInitialized && recordingState.isRecording && !recordingState.isPaused,
    canResume: isInitialized && recordingState.isPaused,
    canStop: isInitialized && (recordingState.isRecording || recordingState.isPaused),
  }
}