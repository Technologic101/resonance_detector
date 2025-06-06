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
  private testToneSource: AudioBufferSourceNode | OscillatorNode | null = null
  private testToneGain: GainNode | null = null
  
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
      console.log('AudioRecorder: MediaRecorder stopped')
      this.stopAnalysis()
      this.stopTestTone()
    }

    this.mediaRecorder.onpause = () => {
      console.log('AudioRecorder: MediaRecorder paused')
      this.lastPauseTime = Date.now()
      this.stopAnalysis()
      this.stopTestTone()
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

  private async _playSelectedSoundEffect(soundType: SoundType): Promise<void> {
    if (!this.audioContext) return

    try {
      // Stop any existing test tone
      this.stopTestTone()

      // Create gain node for volume control
      this.testToneGain = this.audioContext.createGain()
      this.testToneGain.connect(this.audioContext.destination)

      // Set initial volume
      this.testToneGain.gain.setValueAtTime(0, this.audioContext.currentTime)

      switch (soundType) {
        case SoundType.SINE_WAVE_SWEEP:
          await this._playSineWaveSweep()
          break
        case SoundType.PINK_NOISE:
          await this._playPinkNoise()
          break
        case SoundType.CHIRP_SIGNAL:
          await this._playChirpSignal()
          break
        case SoundType.HAND_CLAP:
          await this._playHandClap()
          break
        case SoundType.AMBIENT:
        default:
          await this._playAmbientTone()
          break
      }

      console.log(`AudioRecorder: Playing ${soundType} sound effect`)
    } catch (error) {
      console.error('AudioRecorder: Failed to play sound effect:', error)
    }
  }

  private async _playSineWaveSweep(): Promise<void> {
    if (!this.audioContext || !this.testToneGain) return

    const oscillator = this.audioContext.createOscillator()
    this.testToneSource = oscillator

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime)
    
    // Sweep from 100Hz to 2000Hz over 2 seconds
    oscillator.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + 2)

    oscillator.connect(this.testToneGain)

    // Fade in and out
    this.testToneGain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1)
    this.testToneGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2.1)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 2.1)
  }

  private async _playPinkNoise(): Promise<void> {
    if (!this.audioContext || !this.testToneGain) return

    // Create white noise and filter it to approximate pink noise
    const bufferSize = this.audioContext.sampleRate * 2 // 2 seconds
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = this.audioContext.createBufferSource()
    this.testToneSource = source
    source.buffer = buffer

    // Create a simple low-pass filter to approximate pink noise
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime)
    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime)

    source.connect(filter)
    filter.connect(this.testToneGain)

    // Fade in and out
    this.testToneGain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.1)
    this.testToneGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.9)

    source.start(this.audioContext.currentTime)
    source.stop(this.audioContext.currentTime + 2)
  }

  private async _playChirpSignal(): Promise<void> {
    if (!this.audioContext || !this.testToneGain) return

    const oscillator = this.audioContext.createOscillator()
    this.testToneSource = oscillator

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime)
    
    // Exponential chirp from 200Hz to 4000Hz over 1.5 seconds
    oscillator.frequency.exponentialRampToValueAtTime(4000, this.audioContext.currentTime + 1.5)

    oscillator.connect(this.testToneGain)

    // Quick fade in and out
    this.testToneGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.05)
    this.testToneGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.55)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 1.6)
  }

  private async _playHandClap(): Promise<void> {
    if (!this.audioContext || !this.testToneGain) return

    // Simulate hand clap with short burst of filtered noise
    const bufferSize = this.audioContext.sampleRate * 0.2 // 200ms
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate noise with exponential decay
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.1))
      data[i] = (Math.random() * 2 - 1) * decay
    }

    const source = this.audioContext.createBufferSource()
    this.testToneSource = source
    source.buffer = buffer

    // High-pass filter to simulate hand clap frequency content
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime)
    filter.Q.setValueAtTime(2, this.audioContext.currentTime)

    source.connect(filter)
    filter.connect(this.testToneGain)

    // Quick attack
    this.testToneGain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    this.testToneGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2)

    source.start(this.audioContext.currentTime)
    source.stop(this.audioContext.currentTime + 0.2)
  }

  private async _playAmbientTone(): Promise<void> {
    if (!this.audioContext || !this.testToneGain) return

    // Simple 1kHz tone for ambient recording
    const oscillator = this.audioContext.createOscillator()
    this.testToneSource = oscillator

    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime)
    oscillator.type = 'sine'

    oscillator.connect(this.testToneGain)

    // Gentle fade in and out
    this.testToneGain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.1)
    this.testToneGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.9)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 1)
  }

  private stopTestTone(): void {
    if (this.testToneSource) {
      try {
        if ('stop' in this.testToneSource) {
          this.testToneSource.stop()
        }
        if ('disconnect' in this.testToneSource) {
          this.testToneSource.disconnect()
        }
      } catch (error) {
        // Source might already be stopped
      }
      this.testToneSource = null
    }
    if (this.testToneGain) {
      this.testToneGain.disconnect()
      this.testToneGain = null
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
    
    // Play selected sound effect when recording starts
    await this._playSelectedSoundEffect(soundType)
    
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

      console.log('AudioRecorder: Stopping recording, duration:', duration)

      // Set up the stop handler before stopping
      const originalOnStop = this.mediaRecorder.onstop
      this.mediaRecorder.onstop = () => {
        // Call original handler first
        if (originalOnStop) {
          originalOnStop.call(this.mediaRecorder, new Event('stop'))
        }

        const mimeType = this.getSupportedMimeType()
        const blob = new Blob(this.chunks, { type: mimeType })
        this.chunks = []
        
        console.log('AudioRecorder: Created blob, size:', blob.size)
        
        this.updateState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          level: 0,
          error: null,
        })
        
        resolve(blob)
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
    console.log('AudioRecorder: Disposing...')
    
    this.stopAnalysis()
    this.stopTestTone()
    
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