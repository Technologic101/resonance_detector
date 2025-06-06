import { SpaceType, SoundType, SignalQuality } from '@/lib/types'

export function getSpaceTypeLabel(type: SpaceType): string {
  switch (type) {
    case SpaceType.RESIDENTIAL:
      return 'Residential'
    case SpaceType.COMMERCIAL:
      return 'Commercial'
    case SpaceType.INDUSTRIAL:
      return 'Industrial'
    case SpaceType.PERFORMANCE_VENUE:
      return 'Performance Venue'
    case SpaceType.EDUCATIONAL:
      return 'Educational'
    case SpaceType.RELIGIOUS:
      return 'Religious'
    case SpaceType.OTHER:
      return 'Other'
    default:
      return 'Unknown'
  }
}

export function getSpaceTypeIcon(type: SpaceType): string {
  switch (type) {
    case SpaceType.RESIDENTIAL:
      return 'home'
    case SpaceType.COMMERCIAL:
      return 'building'
    case SpaceType.INDUSTRIAL:
      return 'factory'
    case SpaceType.PERFORMANCE_VENUE:
      return 'theater'
    case SpaceType.EDUCATIONAL:
      return 'graduation-cap'
    case SpaceType.RELIGIOUS:
      return 'church'
    case SpaceType.OTHER:
      return 'map-pin'
    default:
      return 'map-pin'
  }
}

export function getSoundTypeLabel(type: SoundType): string {
  switch (type) {
    case SoundType.SINE_WAVE_SWEEP:
      return 'Sine Wave Sweep'
    case SoundType.PINK_NOISE:
      return 'Pink Noise'
    case SoundType.CHIRP_SIGNAL:
      return 'Chirp Signal'
    case SoundType.HAND_CLAP:
      return 'Hand Clap'
    case SoundType.AMBIENT:
      return 'Ambient'
    default:
      return 'Unknown'
  }
}

export function getSoundTypeIcon(type: SoundType): string {
  switch (type) {
    case SoundType.SINE_WAVE_SWEEP:
      return 'trending-up'
    case SoundType.PINK_NOISE:
      return 'radio'
    case SoundType.CHIRP_SIGNAL:
      return 'activity'
    case SoundType.HAND_CLAP:
      return 'hand'
    case SoundType.AMBIENT:
      return 'ear'
    default:
      return 'mic'
  }
}

export function getSignalQualityColor(quality: SignalQuality): string {
  switch (quality) {
    case SignalQuality.EXCELLENT:
      return 'text-green-600'
    case SignalQuality.GOOD:
      return 'text-blue-600'
    case SignalQuality.FAIR:
      return 'text-yellow-600'
    case SignalQuality.POOR:
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export function getSignalQualityBgColor(quality: SignalQuality): string {
  switch (quality) {
    case SignalQuality.EXCELLENT:
      return 'bg-green-100 text-green-800'
    case SignalQuality.GOOD:
      return 'bg-blue-100 text-blue-800'
    case SignalQuality.FAIR:
      return 'bg-yellow-100 text-yellow-800'
    case SignalQuality.POOR:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return `${hours}h ${remainingMinutes}m`
}

export function formatFrequency(frequency: number): string {
  if (frequency < 1000) {
    return `${frequency.toFixed(1)} Hz`
  }
  
  return `${(frequency / 1000).toFixed(2)} kHz`
}

export function formatAmplitude(amplitude: number): string {
  return `${amplitude.toFixed(2)} dB`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  return formatDate(date)
}