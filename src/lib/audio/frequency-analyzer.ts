import { AudioMetrics } from './audio-processor'
import { FrequencyPeak } from '@/lib/types'

export interface FrequencyAnalysisResult {
  peaks: FrequencyPeak[]
  fundamentalFrequency: number
  harmonics: number[]
  noiseFloor: number
  snr: number
  thd: number
}

export class FrequencyAnalyzer {
  private sampleRate: number
  private fftSize: number

  constructor(sampleRate: number = 48000, fftSize: number = 2048) {
    this.sampleRate = sampleRate
    this.fftSize = fftSize
  }

  analyzeFrequencies(frequencyData: Uint8Array, metrics: AudioMetrics): FrequencyAnalysisResult {
    const peaks = this.findPeaks(frequencyData)
    const fundamentalFrequency = this.findFundamentalFrequency(peaks)
    const harmonics = this.findHarmonics(fundamentalFrequency, peaks)
    const noiseFloor = this.calculateNoiseFloor(frequencyData)
    const snr = this.calculateSNR(peaks, noiseFloor)
    const thd = this.calculateTHD(fundamentalFrequency, harmonics, peaks)

    return {
      peaks,
      fundamentalFrequency,
      harmonics,
      noiseFloor,
      snr,
      thd,
    }
  }

  private findPeaks(frequencyData: Uint8Array, threshold: number = 20): FrequencyPeak[] {
    const peaks: FrequencyPeak[] = []
    const minDistance = 5 // Minimum distance between peaks in bins

    for (let i = minDistance; i < frequencyData.length - minDistance; i++) {
      const current = frequencyData[i]
      
      if (current < threshold) continue

      // Check if this is a local maximum
      let isLocalMax = true
      for (let j = i - minDistance; j <= i + minDistance; j++) {
        if (j !== i && frequencyData[j] >= current) {
          isLocalMax = false
          break
        }
      }

      if (isLocalMax) {
        const frequency = (i * this.sampleRate) / (this.fftSize * 2)
        const amplitude = current
        const prominence = this.calculateProminence(frequencyData, i)
        const bandwidth = this.calculateBandwidth(frequencyData, i)

        peaks.push({
          id: crypto.randomUUID(),
          frequency,
          amplitude,
          prominence,
          bandwidth,
          classification: this.classifyPeak(frequency, amplitude),
        })
      }
    }

    // Sort by amplitude (strongest first)
    return peaks.sort((a, b) => b.amplitude - a.amplitude)
  }

  private calculateProminence(frequencyData: Uint8Array, peakIndex: number): number {
    const peakValue = frequencyData[peakIndex]
    
    // Find the minimum value in the surrounding area
    let minLeft = peakValue
    let minRight = peakValue
    
    // Search left
    for (let i = peakIndex - 1; i >= 0; i--) {
      if (frequencyData[i] < minLeft) {
        minLeft = frequencyData[i]
      }
      if (frequencyData[i] > peakValue * 0.5) break
    }
    
    // Search right
    for (let i = peakIndex + 1; i < frequencyData.length; i++) {
      if (frequencyData[i] < minRight) {
        minRight = frequencyData[i]
      }
      if (frequencyData[i] > peakValue * 0.5) break
    }
    
    const minSurrounding = Math.max(minLeft, minRight)
    return peakValue - minSurrounding
  }

  private calculateBandwidth(frequencyData: Uint8Array, peakIndex: number): number {
    const peakValue = frequencyData[peakIndex]
    const halfMax = peakValue * 0.5
    
    // Find left edge
    let leftEdge = peakIndex
    for (let i = peakIndex - 1; i >= 0; i--) {
      if (frequencyData[i] <= halfMax) {
        leftEdge = i
        break
      }
    }
    
    // Find right edge
    let rightEdge = peakIndex
    for (let i = peakIndex + 1; i < frequencyData.length; i++) {
      if (frequencyData[i] <= halfMax) {
        rightEdge = i
        break
      }
    }
    
    const bandwidthBins = rightEdge - leftEdge
    return (bandwidthBins * this.sampleRate) / (this.fftSize * 2)
  }

  private classifyPeak(frequency: number, amplitude: number): string {
    if (frequency < 100) return 'sub-bass'
    if (frequency < 250) return 'bass'
    if (frequency < 500) return 'low-mid'
    if (frequency < 2000) return 'mid'
    if (frequency < 4000) return 'high-mid'
    if (frequency < 8000) return 'presence'
    return 'brilliance'
  }

  private findFundamentalFrequency(peaks: FrequencyPeak[]): number {
    if (peaks.length === 0) return 0
    
    // The fundamental is typically the strongest low-frequency peak
    const lowFrequencyPeaks = peaks.filter(peak => peak.frequency < 2000)
    if (lowFrequencyPeaks.length > 0) {
      return lowFrequencyPeaks[0].frequency
    }
    
    return peaks[0].frequency
  }

  private findHarmonics(fundamental: number, peaks: FrequencyPeak[]): number[] {
    if (fundamental === 0) return []
    
    const harmonics: number[] = []
    const tolerance = 0.1 // 10% tolerance for harmonic detection
    
    for (let harmonic = 2; harmonic <= 10; harmonic++) {
      const expectedFreq = fundamental * harmonic
      const peak = peaks.find(p => 
        Math.abs(p.frequency - expectedFreq) / expectedFreq < tolerance
      )
      
      if (peak) {
        harmonics.push(peak.frequency)
      }
    }
    
    return harmonics
  }

  private calculateNoiseFloor(frequencyData: Uint8Array): number {
    // Calculate the 10th percentile as noise floor (more robust than median)
    const sorted = Array.from(frequencyData).sort((a, b) => a - b)
    const percentile10Index = Math.floor(sorted.length * 0.1)
    const noiseFloor = sorted[percentile10Index]
    
    // Ensure noise floor is never zero to avoid division by zero
    return Math.max(noiseFloor, 1)
  }

  private calculateSNR(peaks: FrequencyPeak[], noiseFloor: number): number {
    if (peaks.length === 0) return 0
    
    const signalPower = peaks[0].amplitude
    const noisePower = Math.max(noiseFloor, 1) // Ensure never zero
    
    // Avoid division by zero and handle edge cases
    if (noisePower === 0 || signalPower === 0) return 0
    
    // Calculate SNR in dB, with reasonable bounds
    const ratio = signalPower / noisePower
    if (!isFinite(ratio) || ratio <= 0) return 0
    
    const snr = 20 * Math.log10(ratio)
    
    // Clamp SNR to reasonable range (-20 to 80 dB)
    return Math.max(-20, Math.min(80, isFinite(snr) ? snr : 0))
  }

  private calculateTHD(fundamental: number, harmonics: number[], peaks: FrequencyPeak[]): number {
    if (fundamental === 0 || harmonics.length === 0) return 0
    
    const fundamentalPeak = peaks.find(p => Math.abs(p.frequency - fundamental) < 10)
    if (!fundamentalPeak) return 0
    
    let harmonicPowerSum = 0
    for (const harmonic of harmonics) {
      const harmonicPeak = peaks.find(p => Math.abs(p.frequency - harmonic) < 10)
      if (harmonicPeak) {
        harmonicPowerSum += harmonicPeak.amplitude * harmonicPeak.amplitude
      }
    }
    
    const fundamentalPower = fundamentalPeak.amplitude * fundamentalPeak.amplitude
    
    if (fundamentalPower === 0) return 0
    
    const thd = Math.sqrt(harmonicPowerSum / fundamentalPower) * 100
    
    // Clamp THD to reasonable range (0 to 100%)
    return Math.max(0, Math.min(100, isFinite(thd) ? thd : 0))
  }
}