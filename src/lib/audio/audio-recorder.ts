export interface AudioRecorderConfig {
  sampleRate?: number
  channelCount?: number
  bitDepth?: number
  maxDuration?: number
  minDuration?: number
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
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private dataArray: Uint8Array | null = null
  private chunks: Blob[] = []
  private startTime: number = 0
  private animationFrame: number = 0
  
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
      ...config,
    }
    this.onStateChange = onStateChange
    this.onAnalysis = onAnalysis
  }

  async initialize(): Promise<void> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
      })

      // Create analyser for real-time analysis
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8
      
      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(stream)
      this.microphone.connect(this.analyser)
      
      // Create data array for analysis
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType(),
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
      this.updateState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        level: 0,
        error: error instanceof Error ? error.message : 'Failed to initialize audio',
      })
      throw error
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
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

    this.mediaRecorder.onerror = (event) => {
      this.updateState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        level: 0,
        error: 'Recording error occurred',
      })
    }
  }

  async startRecording(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'inactive') {
      throw new Error('Recorder not ready')
    }

    this.chunks = []
    this.startTime = Date.now()
    
    this.mediaRecorder.start(100) // Collect data every 100ms
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
    this.stopAnalysis()
    
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
    this.startAnalysis()
    
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
        const blob = new Blob(this.chunks, { type: this.getSupportedMimeType() })
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
    if (!this.analyser || !this.dataArray) return

    const analyze = () => {
      if (!this.analyser || !this.dataArray) return

      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray)
      
      // Calculate RMS and peak levels
      let sum = 0
      let peak = 0
      
      for (let i = 0; i < this.dataArray.length; i++) {
        const value = this.dataArray[i] / 255
        sum += value * value
        peak = Math.max(peak, value)
      }
      
      const rms = Math.sqrt(sum / this.dataArray.length)
      
      // Find dominant frequency
      let maxIndex = 0
      let maxValue = 0
      
      for (let i = 0; i < this.dataArray.length; i++) {
        if (this.dataArray[i] > maxValue) {
          maxValue = this.dataArray[i]
          maxIndex = i
        }
      }
      
      const frequency = (maxIndex * this.config.sampleRate) / (this.analyser.fftSize * 2)
      
      // Determine signal quality
      const signalQuality = this.calculateSignalQuality(rms, peak)
      
      // Update analysis
      this.onAnalysis({
        rms,
        peak,
        frequency,
        signalQuality,
      })
      
      // Update recording state
      this.updateState({
        isRecording: true,
        isPaused: false,
        duration: this.getCurrentDuration(),
        level: peak,
        error: null,
      })
      
      // Check max duration
      if (this.getCurrentDuration() >= this.config.maxDuration) {
        this.stopRecording()
        return
      }
      
      this.animationFrame = requestAnimationFrame(analyze)
    }
    
    analyze()
  }

  private stopAnalysis(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = 0
    }
  }

  private calculateSignalQuality(rms: number, peak: number): 'excellent' | 'good' | 'fair' | 'poor' {
    const snr = peak > 0 ? rms / peak : 0
    
    if (peak > 0.8 && snr > 0.6) return 'excellent'
    if (peak > 0.6 && snr > 0.4) return 'good'
    if (peak > 0.3 && snr > 0.2) return 'fair'
    return 'poor'
  }

  private getCurrentDuration(): number {
    return this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0
  }

  private updateState(state: RecordingState): void {
    this.onStateChange(state)
  }

  dispose(): void {
    this.stopAnalysis()
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    
    if (this.microphone) {
      this.microphone.disconnect()
    }
    
    if (this.audioContext) {
      this.audioContext.close()
    }
    
    this.mediaRecorder = null
    this.audioContext = null
    this.analyser = null
    this.microphone = null
    this.dataArray = null
  }
}