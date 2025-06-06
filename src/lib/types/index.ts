export enum SpaceType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  PERFORMANCE_VENUE = 'performanceVenue',
  EDUCATIONAL = 'educational',
  RELIGIOUS = 'religious',
  OTHER = 'other',
}

export enum SoundType {
  SINE_WAVE_SWEEP = 'sineWaveSweep',
  PINK_NOISE = 'pinkNoise',
  CHIRP_SIGNAL = 'chirpSignal',
  HAND_CLAP = 'handClap',
  AMBIENT = 'ambient',
}

export enum SignalQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export interface FrequencyPeak {
  id: string
  frequency: number
  amplitude: number
  prominence: number
  bandwidth?: number
  classification?: string
}

export interface ResonanceFrequency {
  id: string
  frequency: number
  amplitude: number
  confidence: number
  classification?: string
}

export interface Space {
  id: string
  name: string
  description: string
  type: SpaceType
  createdAt: Date
  updatedAt: Date
  sampleIds: string[]
  metadata: Record<string, any>
  environmentalConditions: Record<string, number>
  analyzedFrequencies: ResonanceFrequency[]
}

export interface Sample {
  id: string
  spaceId: string
  soundType: SoundType
  audioFilePath: string
  recordedAt: Date
  duration: number
  ambientNoiseLevel: number
  peaks: FrequencyPeak[]
  spectralData: Record<string, any>
  signalQuality: SignalQuality
  sampleRate: number
  recordingSettings: Record<string, any>
}

export interface CreateSpaceData {
  name: string
  description: string
  type: SpaceType
  metadata?: Record<string, any>
  environmentalConditions?: Record<string, number>
}

export interface CreateSampleData {
  spaceId: string
  soundType: SoundType
  audioFilePath: string
  duration: number
  ambientNoiseLevel?: number
  peaks?: FrequencyPeak[]
  spectralData?: Record<string, any>
  signalQuality?: SignalQuality
  sampleRate?: number
  recordingSettings?: Record<string, any>
}