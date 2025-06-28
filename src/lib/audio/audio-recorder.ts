import { AudioProcessor, AudioMetrics } from './audio-processor'
import { FrequencyAnalyzer, FrequencyAnalysisResult } from './frequency-analyzer'
import { SoundType } from '@/lib/types'

export interface AudioRecorderConfig {
  sampleRate?: number
  channelCount?: number
  bitDepth?: number
  maxDuration?: number
  minDuration?: number
  enableEchoCancellation?: boolean
  enableNoiseSuppression?: boolean
  enableAutoGainControl?: boolean
}

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  level: number
  error: string | null
}

export interface AudioAnalysis {
  rms: number
  peak: number
  frequency: number
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor'
  metrics: AudioMetrics
  frequencyAnalysis: FrequencyAnalysisResult
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private processor: AudioProcessor | null = null
  private analyzer: FrequencyAnalyzer | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private chunks: Blob[] = []
  private startTime: number = 0
  private pausedDuration: number = 0
  private lastPauseTime: number = 0
  private animationFrame: number = 0
  private stream: MediaStream | null = null
  private testAudioSource: AudioBufferSourceNode | null = null
  private testAudioGain: GainNode | null = null
  private recordingTimeout: number | null = null
  
  private config: Required<AudioRecorderConfig>
  private onStateChange: (state: RecordingState) => void
  private onAnalysis: (analysis: AudioAnalysis) => void

  constructor(
    config: AudioRecorderConfig = {},
    onStateChange: (state: RecordingState) => void,
    onAnalysis: (analysis: AudioAnalysis) => void
  ) {
    this.config = {
      sampleRate: 48000,
      channelCount: 1,
      bitDepth: 16,
      maxDuration: 300, // 5 minutes
      minDuration: 1, // 1 second
      enableEchoCancellation: false,
      enableNoiseSuppression: false,
      enableAutoGainControl: false,
      ...config,
    }
    this.onStateChange = onStateChange
    this.onAnalysis = onAnalysis
  }

  async initialize(): Promise<void> {
    try {
      console.log('AudioRecorder: Starting initialization...')
      
      // Request microphone access with specific constraints
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.enableEchoCancellation,
          noiseSuppression: this.config.enableNoiseSuppression,
          autoGainControl: this.config.enableAutoGainControl,
        },
      })

      console.log('AudioRecorder: Got media stream')

      // Create audio context with specified sample rate
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
      })

      console.log('AudioRecorder: Created audio context, state:', this.audioContext.state)

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
        console.log('AudioRecorder: Resumed audio context')
      }

      // Create audio processor and analyzer
      this.processor = new AudioProcessor(this.audioContext, {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
      })

      this.analyzer = new FrequencyAnalyzer(this.config.sampleRate, 2048)
      
      // Connect microphone to processor
      this.microphone = this.audioContext.createMediaStreamSource(this.stream)
      this.microphone.connect(this.processor.getAnalyser())

      console.log('AudioRecorder: Connected audio processing chain')

      // Create media recorder with optimal settings
      const mimeType = this.getSupportedMimeType()
      console.log('AudioRecorder: Using MIME type:', mimeType)
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: this.config.sampleRate * this.config.channelCount * this.config.bitDepth,
      })

      this.setupMediaRecorderEvents()
      
      this.updateState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        level: 0,
        error: null,
      })

      console.log('AudioRecorder: Initialization complete')
    } catch (error) {
      console.error('AudioRecorder: Initialization failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio'
      this.updateState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        level: 0,
        error: errorMessage,
      })
      throw error
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('AudioRecorder: Found supported MIME type:', type)
        return type
      }
    }
    
    console.warn('AudioRecorder: No supported MIME type found, using default')
    return ''
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return

    this.mediaRecorder.ondataavailable = (event) => {
      console.log('AudioRecorder: Data available, size:', event.data.size)
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.onstop = () => {
      console.log('AudioRecorder: MediaRecorder stopped, chunks:', this.chunks.length)
      this.stopAnalysis()
      this.stopTestAudio()
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout)
        this.recordingTimeout = null
      }
    }

    this.mediaRecorder.onpause = () => {
      console.log('AudioRecorder: MediaRecorder paused')
      this.lastPauseTime = Date.now()
      this.stopAnalysis()
      this.stopTestAudio()
    }

    this.mediaRecorder.onresume = () => {
      console.log('AudioRecorder: MediaRecorder resumed')
      if (this.lastPauseTime > 0) {
        this.pausedDuration += Date.now() - this.lastPauseTime
        this.lastPauseTime = 0
      }
      this.startAnalysis()
    }

    this.mediaRecorder.onstart = () => {
      console.log('AudioRecorder: MediaRecorder started')
    }

    this.mediaRecorder.onerror = (event) => {
      console.error('AudioRecorder: MediaRecorder error:', event)
      this.updateState({
        isRecording: false,
        isPaused: false,
        duration: this.getCurrentDuration(),
        level: 0,
        error: 'Recording error occurred',
      })
    }
  }

  private async loadWavFile(soundType: SoundType): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized')

    let wavPath: string
    switch (soundType) {
      case SoundType.LINEAR_SWEEP:
        wavPath = '/audio/wav/sweep20-20klin.wav'
        break
      case SoundType.LOGARITHMIC_SWEEP:
        wavPath = '/audio/wav/sweep20-20klog.wav'
        break
      case SoundType.PINK_NOISE:
        wavPath = '/audio/wav/pinknoise.wav'
        break
      case SoundType.WHITE_NOISE:
        wavPath = '/audio/wav/whitenoisegaussian.wav'
        break
      default:
        throw new Error(`No WAV file available for sound type: ${soundType}`)
    }

    try {
      const response = await fetch(wavPath)
      if (!response.ok) throw new Error(`Failed to load WAV file: ${response.statusText}`)
      
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      console.log(`AudioRecorder: Loaded WAV file for ${soundType}, duration: ${audioBuffer.duration}s`)
      return audioBuffer
    } catch (error) {
      console.error(`AudioRecorder: Failed to load WAV file for ${soundType}:`, error)
      throw error
    }
  }

  private async playWavFile(soundType: SoundType): Promise<number> {
    if (!this.audioContext) throw new Error('Audio context not initialized')

    try {
      // Stop any existing test audio
      this.stopTestAudio()

      // Load the WAV file
      const audioBuffer = await this.loadWavFile(soundType)

      // Create gain node for volume control
      this.testAudioGain = this.audioContext.createGain()
      this.testAudioGain.connect(this.audioContext.destination)

      // Create buffer source
      this.testAudioSource = this.audioContext.createBufferSource()
      this.testAudioSource.buffer = audioBuffer
      this.testAudioSource.connect(this.testAudioGain)

      // Set volume (lower for test signals)
      this.testAudioGain.gain.setValueAtTime(0.3, this.audioContext.currentTime)

      // Play the audio
      this.testAudioSource.start(this.audioContext.currentTime)

      console.log(`AudioRecorder: Playing ${soundType} WAV file, duration: ${audioBuffer.duration}s`)
      
      return audioBuffer.duration
    } catch (error) {
      console.error('AudioRecorder: Failed to play WAV file:', error)
      throw error
    }
  }

  private stopTestAudio(): void {
    if (this.testAudioSource) {
      try {
        this.testAudioSource.stop()
        this.testAudioSource.disconnect()
      } catch (error) {
        // Source might already be stopped
      }
      this.testAudioSource = null
    }
    if (this.testAudioGain) {
      this.testAudioGain.disconnect()
      this.testAudioGain = null
    }
  }

  async startRecording(soundType: SoundType = SoundType.AMBIENT): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'inactive') {
      throw new Error('Recorder not ready')
    }

    if (!this.audioContext || this.audioContext.state === 'suspended') {
      await this.audioContext?.resume()
    }

    console.log('AudioRecorder: Starting recording...')

    this.chunks = []
    this.startTime = Date.now()
    this.pausedDuration = 0
    this.lastPauseTime = 0
    
    // Start recording with time slice for better data handling
    this.mediaRecorder.start(100)
    this.startAnalysis()
    
    // Play WAV file if not ambient recording
    if (soundType !== SoundType.AMBIENT) {
      try {
        const audioDuration = await this.playWavFile(soundType)
        
        // Set timeout to automatically stop recording when audio ends
        this.recordingTimeout = window.setTimeout(() => {
          console.log('AudioRecorder: Auto-stopping recording after audio completion')
          this.stopRecording().catch(console.error)
        }, (audioDuration + 0.5) * 1000) // Add 0.5s buffer
        
      } catch (error) {
        console.error('AudioRecorder: Failed to play test audio, continuing with recording:', error)
      }
    }
    
    this.updateState({
      isRecording: true,
      isPaused: false,
      duration: 0,
      level: 0,
      error: null,
    })

    console.log('AudioRecorder: Recording started')
  }

  pauseRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      console.warn('AudioRecorder: Cannot pause - not recording')
      return
    }

    console.log('AudioRecorder: Pausing recording...')
    this.mediaRecorder.pause()
    
    this.updateState({
      isRecording: false,
      isPaused: true,
      duration: this.getCurrentDuration(),
      level: 0,
      error: null,
    })
  }

  resumeRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      console.warn('AudioRecorder: Cannot resume - not paused')
      return
    }

    console.log('AudioRecorder: Resuming recording...')
    this.mediaRecorder.resume()
    
    this.updateState({
      isRecording: true,
      isPaused: false,
      duration: this.getCurrentDuration(),
      level: 0,
      error: null,
    })
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recorder available'))
        return
      }

      // Check if we can stop (must be recording or paused)
      if (this.mediaRecorder.state === 'inactive') {
        reject(new Error('Recording is not active'))
        return
      }

      const duration = this.getCurrentDuration()
      
      if (duration < this.config.minDuration) {
        reject(new Error(`Recording too short. Minimum duration is ${this.config.minDuration} seconds`))
        return
      }

      console.log('AudioRecorder: Stopping recording, duration:', duration, 'chunks before stop:', this.chunks.length)

      // Clear any auto-stop timeout
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout)
        this.recordingTimeout = null
      }

      // Set up the stop handler before stopping
      const originalOnStop = this.mediaRecorder.onstop
      this.mediaRecorder.onstop = (event) => {
        console.log('AudioRecorder: Stop event fired, chunks after stop:', this.chunks.length)
        
        // Call original handler first
        if (originalOnStop) {
          originalOnStop.call(this.mediaRecorder, event)
        }

        // Wait a bit for any final chunks
        setTimeout(() => {
          console.log('AudioRecorder: Creating blob from chunks:', this.chunks.length)
          
          if (this.chunks.length === 0) {
            reject(new Error('No audio data recorded'))
            return
          }

          const mimeType = this.getSupportedMimeType()
          const blob = new Blob(this.chunks, { type: mimeType })
          
          console.log('AudioRecorder: Created blob, size:', blob.size, 'type:', blob.type)
          
          if (blob.size === 0) {
            reject(new Error('Recording blob is empty'))
            return
          }
          
          // Clear chunks after creating blob
          this.chunks = []
          
          this.updateState({
            isRecording: false,
            isPaused: false,
            duration: 0,
            level: 0,
            error: null,
          })
          
          resolve(blob)
        }, 100) // Small delay to ensure all chunks are collected
      }

      // Stop the recording
      try {
        this.mediaRecorder.stop()
      } catch (error) {
        console.error('AudioRecorder: Error stopping MediaRecorder:', error)
        reject(error)
      }
    })
  }

  private startAnalysis(): void {
    if (!this.processor || !this.analyzer || !this.audioContext) {
      console.warn('AudioRecorder: Cannot start analysis - missing components')
      return
    }

    console.log('AudioRecorder: Starting analysis loop')

    const analyze = () => {
      if (!this.processor || !this.analyzer || !this.audioContext) return

      try {
        // Get audio metrics
        const metrics = this.processor.getMetrics(this.config.sampleRate)
        
        // Get frequency data for detailed analysis
        const analyser = this.processor.getAnalyser()
        const frequencyData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(frequencyData)
        
        // Perform frequency analysis
        const frequencyAnalysis = this.analyzer.analyzeFrequencies(frequencyData, metrics)
        
        // Determine signal quality
        const signalQuality = this.calculateSignalQuality(metrics, frequencyAnalysis)
        
        // Create analysis object
        const analysis: AudioAnalysis = {
          rms: metrics.rms,
          peak: metrics.peak,
          frequency: metrics.frequency,
          signalQuality,
          metrics,
          frequencyAnalysis,
        }
        
        // Update analysis
        this.onAnalysis(analysis)
        
        // Update recording state
        this.updateState({
          isRecording: true,
          isPaused: false,
          duration: this.getCurrentDuration(),
          level: metrics.peak,
          error: null,
        })
        
        // Check max duration
        if (this.getCurrentDuration() >= this.config.maxDuration) {
          console.log('AudioRecorder: Max duration reached, stopping')
          this.stopRecording().catch(console.error)
          return
        }
        
        this.animationFrame = requestAnimationFrame(analyze)
      } catch (error) {
        console.error('AudioRecorder: Analysis error:', error)
        this.animationFrame = requestAnimationFrame(analyze)
      }
    }
    
    analyze()
  }

  private stopAnalysis(): void {
    if (this.animationFrame) {
      console.log('AudioRecorder: Stopping analysis loop')
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = 0
    }
  }

  private calculateSignalQuality(
    metrics: AudioMetrics, 
    frequencyAnalysis: FrequencyAnalysisResult
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const { rms, peak, zeroCrossingRate } = metrics
    const { snr, peaks } = frequencyAnalysis
    
    // Calculate quality score based on multiple factors
    let score = 0
    
    // RMS level (0-25 points)
    if (rms > 0.1) score += 25
    else if (rms > 0.05) score += 20
    else if (rms > 0.02) score += 15
    else if (rms > 0.01) score += 10
    else score += 5
    
    // Peak level (0-25 points)
    if (peak > 0.3 && peak < 0.95) score += 25
    else if (peak > 0.2 && peak < 0.98) score += 20
    else if (peak > 0.1) score += 15
    else if (peak > 0.05) score += 10
    else score += 5
    
    // Signal-to-noise ratio (0-25 points) - handle infinity
    const validSnr = isFinite(snr) ? snr : 0
    if (validSnr > 40) score += 25
    else if (validSnr > 30) score += 20
    else if (validSnr > 20) score += 15
    else if (validSnr > 10) score += 10
    else score += 5
    
    // Frequency content (0-25 points)
    if (peaks.length > 5) score += 25
    else if (peaks.length > 3) score += 20
    else if (peaks.length > 1) score += 15
    else if (peaks.length > 0) score += 10
    else score += 5
    
    // Determine quality based on total score
    if (score >= 85) return 'excellent'
    if (score >= 70) return 'good'
    if (score >= 50) return 'fair'
    return 'poor'
  }

  private getCurrentDuration(): number {
    if (this.startTime === 0) return 0
    
    const now = Date.now()
    const totalElapsed = now - this.startTime
    const activeDuration = totalElapsed - this.pausedDuration
    
    // If currently paused, subtract the current pause duration
    if (this.lastPauseTime > 0) {
      const currentPauseDuration = now - this.lastPauseTime
      return (activeDuration - currentPauseDuration) / 1000
    }
    
    return activeDuration / 1000
  }

  private updateState(state: RecordingState): void {
    this.onStateChange(state)
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  dispose(): void {
    console.log('AudioRecorder: Disposing...')
    
    this.stopAnalysis()
    this.stopTestAudio()
    
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout)
      this.recordingTimeout = null
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    
    if (this.microphone) {
      this.microphone.disconnect()
    }
    
    if (this.processor) {
      this.processor.dispose()
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.mediaRecorder = null
    this.audioContext = null
    this.processor = null
    this.analyzer = null
    this.microphone = null
    this.stream = null
  }
}