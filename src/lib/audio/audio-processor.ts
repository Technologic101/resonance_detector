export interface AudioProcessorConfig {
  fftSize: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
}

export interface AudioMetrics {
  rms: number
  peak: number
  frequency: number
  spectralCentroid: number
  spectralRolloff: number
  zeroCrossingRate: number
  mfcc: number[]
}

export class AudioProcessor {
  private analyser: AnalyserNode
  private dataArray: Uint8Array
  private frequencyData: Uint8Array
  private config: AudioProcessorConfig

  constructor(audioContext: AudioContext, config: Partial<AudioProcessorConfig> = {}) {
    this.config = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      ...config,
    }

    this.analyser = audioContext.createAnalyser()
    this.analyser.fftSize = this.config.fftSize
    this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant
    this.analyser.minDecibels = this.config.minDecibels
    this.analyser.maxDecibels = this.config.maxDecibels

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
  }

  getAnalyser(): AnalyserNode {
    return this.analyser
  }

  getMetrics(sampleRate: number): AudioMetrics {
    // Get time domain data for RMS and zero crossing rate
    this.analyser.getByteTimeDomainData(this.dataArray)
    
    // Get frequency domain data for spectral analysis
    this.analyser.getByteFrequencyData(this.frequencyData)

    const rms = this.calculateRMS()
    const peak = this.calculatePeak()
    const frequency = this.findDominantFrequency(sampleRate)
    const spectralCentroid = this.calculateSpectralCentroid(sampleRate)
    const spectralRolloff = this.calculateSpectralRolloff(sampleRate)
    const zeroCrossingRate = this.calculateZeroCrossingRate()
    const mfcc = this.calculateMFCC()

    return {
      rms,
      peak,
      frequency,
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      mfcc,
    }
  }

  private calculateRMS(): number {
    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128
      sum += normalized * normalized
    }
    return Math.sqrt(sum / this.dataArray.length)
  }

  private calculatePeak(): number {
    let peak = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = Math.abs((this.dataArray[i] - 128) / 128)
      peak = Math.max(peak, normalized)
    }
    return peak
  }

  private findDominantFrequency(sampleRate: number): number {
    let maxIndex = 0
    let maxValue = 0

    for (let i = 0; i < this.frequencyData.length; i++) {
      if (this.frequencyData[i] > maxValue) {
        maxValue = this.frequencyData[i]
        maxIndex = i
      }
    }

    return (maxIndex * sampleRate) / (this.analyser.fftSize * 2)
  }

  private calculateSpectralCentroid(sampleRate: number): number {
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < this.frequencyData.length; i++) {
      const frequency = (i * sampleRate) / (this.analyser.fftSize * 2)
      const magnitude = this.frequencyData[i]
      
      numerator += frequency * magnitude
      denominator += magnitude
    }

    return denominator > 0 ? numerator / denominator : 0
  }

  private calculateSpectralRolloff(sampleRate: number, threshold: number = 0.85): number {
    const totalEnergy = this.frequencyData.reduce((sum, value) => sum + value, 0)
    const targetEnergy = totalEnergy * threshold

    let cumulativeEnergy = 0
    for (let i = 0; i < this.frequencyData.length; i++) {
      cumulativeEnergy += this.frequencyData[i]
      if (cumulativeEnergy >= targetEnergy) {
        return (i * sampleRate) / (this.analyser.fftSize * 2)
      }
    }

    return (this.frequencyData.length * sampleRate) / (this.analyser.fftSize * 2)
  }

  private calculateZeroCrossingRate(): number {
    let crossings = 0
    for (let i = 1; i < this.dataArray.length; i++) {
      const prev = (this.dataArray[i - 1] - 128) / 128
      const curr = (this.dataArray[i] - 128) / 128
      
      if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
        crossings++
      }
    }
    return crossings / (this.dataArray.length - 1)
  }

  private calculateMFCC(): number[] {
    // Simplified MFCC calculation (first 13 coefficients)
    const mfcc: number[] = []
    const melFilters = this.createMelFilterBank()
    
    for (let i = 0; i < 13; i++) {
      let sum = 0
      for (let j = 0; j < this.frequencyData.length; j++) {
        sum += this.frequencyData[j] * melFilters[i][j]
      }
      mfcc.push(Math.log(Math.max(sum, 1e-10)))
    }
    
    return mfcc
  }

  private createMelFilterBank(): number[][] {
    const numFilters = 13
    const filters: number[][] = []
    
    for (let i = 0; i < numFilters; i++) {
      const filter = new Array(this.frequencyData.length).fill(0)
      // Simplified triangular filter implementation
      const start = Math.floor((i * this.frequencyData.length) / (numFilters + 1))
      const center = Math.floor(((i + 1) * this.frequencyData.length) / (numFilters + 1))
      const end = Math.floor(((i + 2) * this.frequencyData.length) / (numFilters + 1))
      
      for (let j = start; j < center; j++) {
        filter[j] = (j - start) / (center - start)
      }
      for (let j = center; j < end; j++) {
        filter[j] = (end - j) / (end - center)
      }
      
      filters.push(filter)
    }
    
    return filters
  }

  dispose(): void {
    // Cleanup if needed
  }
}