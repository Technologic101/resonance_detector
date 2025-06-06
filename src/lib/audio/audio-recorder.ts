import { AudioProcessor, AudioMetrics } from './audio-processor'
import { FrequencyAnalyzer, FrequencyAnalysisResult } from './frequency-analyzer'

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

      // Create audio context with specified sample rate
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
      })

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
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

      // Create media recorder with optimal settings
      const mimeType = this.getSupportedMimeType()
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
    } catch (error) {
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
        return type
      }
    }
    
    return ''
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.onstop = () => {
      this.stopAnalysis()
    }

    this.mediaRecorder.onpause = () => {
      this.lastPauseTime = Date.now()
      this.stopAnalysis()
    }

    this.mediaRecorder.onresume = () => {
      if (this.lastPauseTime > 0) {
        this.pausedDuration += Date.now() - this.lastPauseTime
        this.lastPauseTime = 0
      }
      this.startAnalysis()
    }

    this.mediaRecorder.onerror = (event) => {
      this.updateState({
        isRecording: false,
        isPaused: false,
        duration: this.getCurrentDuration(),
        level: 0,
        error: 'Recording error occurred',
      })
    }
  }

  async startRecording(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'inactive') {
      throw new Error('Recorder not ready')
    }

    if (!this.audioContext || this.audioContext.state === 'suspended') {
      await this.audioContext?.resume()
    }

    this.chunks = []
    this.startTime = Date.now()
    this.pausedDuration = 0
    this.lastPauseTime = 0
    
    // Start recording with time slice for better data handling
    this.mediaRecorder.start(100)
    this.startAnalysis()
    
    this.updateState({
      isRecording: true,
      isPaused: false,
      duration: 0,
      level: 0,
      error: null,
    })
  }

  pauseRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return
    }

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
      return
    }

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

      const duration = this.getCurrentDuration()
      
      if (duration < this.config.minDuration) {
        reject(new Error(`Recording too short. Minimum duration is ${this.config.minDuration} seconds`))
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.getSupportedMimeType()
        const blob = new Blob(this.chunks, { type: mimeType })
        this.chunks = []
        
        this.updateState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          level: 0,
          error: null,
        })
        
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  private startAnalysis(): void {
    if (!this.processor || !this.analyzer || !this.audioContext) return

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
          this.stopRecording().catch(console.error)
          return
        }
        
        this.animationFrame = requestAnimationFrame(analyze)
      } catch (error) {
        console.error('Analysis error:', error)
        this.animationFrame = requestAnimationFrame(analyze)
      }
    }
    
    analyze()
  }

  private stopAnalysis(): void {
    if (this.animationFrame) {
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
    
    // Signal-to-noise ratio (0-25 points)
    if (snr > 40) score += 25
    else if (snr > 30) score += 20
    else if (snr > 20) score += 15
    else if (snr > 10) score += 10
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
    this.stopAnalysis()
    
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