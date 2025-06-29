"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { InfoTooltip } from '@/components/ui/tooltip'
import { Settings, ArrowLeft, Mic, Volume2, Zap, Clock, Save, RotateCcw } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'

interface AppPreferences {
  // Audio Settings
  defaultSampleRate: number
  defaultChannelCount: number
  enableEchoCancellation: boolean
  enableNoiseSuppression: boolean
  enableAutoGainControl: boolean
  inputGain: number
  outputVolume: number
  
  // Recording Settings
  defaultSoundType: string
  maxRecordingDuration: number
  minRecordingDuration: number
  autoSaveRecordings: boolean
  recordingQuality: string
  
  // Analysis Settings
  fftSize: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
  peakThreshold: number
  
  // UI Settings
  showAdvancedMetrics: boolean
  enableTooltips: boolean
  autoNavigateAfterSave: boolean
  confirmBeforeDelete: boolean
  
  // Calibration Settings
  microphoneCalibration: number
  referenceLevel: number
  frequencyWeighting: string
  calibrationDate: string | null
}

const defaultPreferences: AppPreferences = {
  // Audio Settings
  defaultSampleRate: 48000,
  defaultChannelCount: 1,
  enableEchoCancellation: false,
  enableNoiseSuppression: false,
  enableAutoGainControl: false,
  inputGain: 1.0,
  outputVolume: 0.3,
  
  // Recording Settings
  defaultSoundType: 'ambient',
  maxRecordingDuration: 300,
  minRecordingDuration: 1,
  autoSaveRecordings: true,
  recordingQuality: 'high',
  
  // Analysis Settings
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
  peakThreshold: 20,
  
  // UI Settings
  showAdvancedMetrics: true,
  enableTooltips: true,
  autoNavigateAfterSave: true,
  confirmBeforeDelete: true,
  
  // Calibration Settings
  microphoneCalibration: 0,
  referenceLevel: 94,
  frequencyWeighting: 'A',
  calibrationDate: null,
}

export function SettingsPage() {
  const { setCurrentPage } = useNavigation()
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'audio' | 'recording' | 'analysis' | 'ui' | 'calibration'>('audio')

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('vibeFinderPreferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }
  }, [])

  const updatePreference = <K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const savePreferences = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem('vibeFinderPreferences', JSON.stringify(preferences))
      setHasChanges(false)
      
      // Show success feedback
      setTimeout(() => {
        setIsSaving(false)
      }, 500)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setIsSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
      setPreferences(defaultPreferences)
      setHasChanges(true)
    }
  }

  const runCalibration = async () => {
    if (confirm('This will play a 1kHz calibration tone. Make sure your measurement microphone is connected and positioned correctly.')) {
      try {
        // Create a 1kHz calibration tone
        const audioContext = new AudioContext()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(preferences.outputVolume, audioContext.currentTime)
        
        oscillator.start()
        
        // Play for 3 seconds
        setTimeout(() => {
          oscillator.stop()
          audioContext.close()
          
          // Prompt for measured level
          const measuredLevel = prompt('Enter the measured sound level in dB SPL:')
          if (measuredLevel && !isNaN(parseFloat(measuredLevel))) {
            const calibrationOffset = parseFloat(measuredLevel) - preferences.referenceLevel
            updatePreference('microphoneCalibration', calibrationOffset)
            updatePreference('calibrationDate', new Date().toISOString())
            alert(`Calibration complete. Offset: ${calibrationOffset.toFixed(1)} dB`)
          }
        }, 3000)
        
      } catch (error) {
        console.error('Calibration failed:', error)
        alert('Calibration failed. Please check your audio setup.')
      }
    }
  }

  const tabs = [
    { id: 'audio' as const, label: 'Audio', icon: Volume2 },
    { id: 'recording' as const, label: 'Recording', icon: Mic },
    { id: 'analysis' as const, label: 'Analysis', icon: Zap },
    { id: 'ui' as const, label: 'Interface', icon: Settings },
    { id: 'calibration' as const, label: 'Calibration', icon: Clock },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('home')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button
                onClick={savePreferences}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Audio Settings */}
        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Audio Input/Output</h3>
                <InfoTooltip 
                  content="Configure audio input and output settings for optimal recording quality."
                  side="right"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Sample Rate</label>
                    <InfoTooltip 
                      content="Higher sample rates can capture higher frequencies but use more storage. 48kHz is recommended for most applications."
                      side="top"
                    />
                  </div>
                  <select
                    value={preferences.defaultSampleRate}
                    onChange={(e) => updatePreference('defaultSampleRate', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value={44100}>44.1 kHz (CD Quality)</option>
                    <option value={48000}>48 kHz (Professional)</option>
                    <option value={96000}>96 kHz (High Resolution)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Channels</label>
                    <InfoTooltip 
                      content="Number of audio channels. Mono (1) is sufficient for most acoustic measurements."
                      side="top"
                    />
                  </div>
                  <select
                    value={preferences.defaultChannelCount}
                    onChange={(e) => updatePreference('defaultChannelCount', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value={1}>Mono (1 channel)</option>
                    <option value={2}>Stereo (2 channels)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Input Gain</label>
                    <InfoTooltip 
                      content="Adjust the input sensitivity. Higher values amplify weak signals but may introduce noise."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={preferences.inputGain}
                      onChange={(e) => updatePreference('inputGain', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{preferences.inputGain.toFixed(1)}x</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Test Signal Volume</label>
                    <InfoTooltip 
                      content="Volume level for test signals (sweeps, noise). Lower values prevent speaker damage and hearing damage."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={preferences.outputVolume}
                      onChange={(e) => updatePreference('outputVolume', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{Math.round(preferences.outputVolume * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Echo Cancellation</span>
                    <InfoTooltip 
                      content="Reduces echo and feedback. Disable for accurate acoustic measurements."
                      side="top"
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enableEchoCancellation}
                      onChange={(e) => updatePreference('enableEchoCancellation', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Noise Suppression</span>
                    <InfoTooltip 
                      content="Reduces background noise. Disable for natural acoustic recordings."
                      side="top"
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enableNoiseSuppression}
                      onChange={(e) => updatePreference('enableNoiseSuppression', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Auto Gain Control</span>
                    <InfoTooltip 
                      content="Automatically adjusts input levels. Disable for consistent measurement levels."
                      side="top"
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enableAutoGainControl}
                      onChange={(e) => updatePreference('enableAutoGainControl', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recording Settings */}
        {activeTab === 'recording' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Recording Preferences</h3>
                <InfoTooltip 
                  content="Configure default recording behavior and quality settings."
                  side="right"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Default Sound Type</label>
                    <InfoTooltip 
                      content="The sound type that will be pre-selected when starting a new recording."
                      side="top"
                    />
                  </div>
                  <select
                    value={preferences.defaultSoundType}
                    onChange={(e) => updatePreference('defaultSoundType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="ambient">Ambient Recording</option>
                    <option value="linearSweep">Linear Sweep (20Hz-20kHz)</option>
                    <option value="logarithmicSweep">Logarithmic Sweep (20Hz-20kHz)</option>
                    <option value="pinkNoise">Pink Noise</option>
                    <option value="whiteNoise">White Noise (Gaussian)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Recording Quality</label>
                    <InfoTooltip 
                      content="Higher quality uses more storage but provides better analysis accuracy."
                      side="top"
                    />
                  </div>
                  <select
                    value={preferences.recordingQuality}
                    onChange={(e) => updatePreference('recordingQuality', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="standard">Standard (16-bit)</option>
                    <option value="high">High (24-bit)</option>
                    <option value="maximum">Maximum (32-bit float)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Max Recording Duration</label>
                    <InfoTooltip 
                      content="Maximum length for recordings in seconds. Longer recordings use more storage."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="30"
                      max="600"
                      step="30"
                      value={preferences.maxRecordingDuration}
                      onChange={(e) => updatePreference('maxRecordingDuration', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-16">{Math.floor(preferences.maxRecordingDuration / 60)}:{(preferences.maxRecordingDuration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Min Recording Duration</label>
                    <InfoTooltip 
                      content="Minimum length required for recordings in seconds. Prevents accidental short recordings."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={preferences.minRecordingDuration}
                      onChange={(e) => updatePreference('minRecordingDuration', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{preferences.minRecordingDuration}s</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Auto-save Recordings</span>
                    <InfoTooltip 
                      content="Automatically save recordings after stopping. Disable to manually review before saving."
                      side="top"
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.autoSaveRecordings}
                      onChange={(e) => updatePreference('autoSaveRecordings', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Settings */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Frequency Analysis</h3>
                <InfoTooltip 
                  content="Configure the frequency analysis engine for optimal peak detection and spectral analysis."
                  side="right"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">FFT Size</label>
                    <InfoTooltip 
                      content="Larger FFT sizes provide better frequency resolution but slower processing. 2048 is a good balance."
                      side="top"
                    />
                  </div>
                  <select
                    value={preferences.fftSize}
                    onChange={(e) => updatePreference('fftSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value={1024}>1024 (Fast)</option>
                    <option value={2048}>2048 (Balanced)</option>
                    <option value={4096}>4096 (High Resolution)</option>
                    <option value={8192}>8192 (Maximum)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Peak Threshold</label>
                    <InfoTooltip 
                      content="Minimum amplitude required to detect a frequency peak. Lower values detect more peaks but may include noise."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={preferences.peakThreshold}
                      onChange={(e) => updatePreference('peakThreshold', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{preferences.peakThreshold}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Smoothing</label>
                    <InfoTooltip 
                      content="Time constant for frequency analysis smoothing. Higher values provide more stable readings."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.1"
                      value={preferences.smoothingTimeConstant}
                      onChange={(e) => updatePreference('smoothingTimeConstant', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{preferences.smoothingTimeConstant.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Dynamic Range</label>
                    <InfoTooltip 
                      content="Analysis range in decibels. Wider ranges capture more detail but may include more noise."
                      side="top"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-8">Min:</span>
                      <input
                        type="range"
                        min="-120"
                        max="-60"
                        step="10"
                        value={preferences.minDecibels}
                        onChange={(e) => updatePreference('minDecibels', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-12">{preferences.minDecibels} dB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-8">Max:</span>
                      <input
                        type="range"
                        min="-30"
                        max="0"
                        step="5"
                        value={preferences.maxDecibels}
                        onChange={(e) => updatePreference('maxDecibels', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-12">{preferences.maxDecibels} dB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UI Settings */}
        {activeTab === 'ui' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">User Interface</h3>
                <InfoTooltip 
                  content="Customize the user interface behavior and information display."
                  side="right"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Show Advanced Metrics</span>
                    <InfoTooltip 
                      content="Display detailed acoustic metrics like spectral centroid, zero crossing rate, etc."
                      side="top"
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.showAdvancedMetrics}
                      onChange={(e) => updatePreference('showAdvancedMetrics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Enable Tooltips</span>
                    <InfoTooltip 
                      content="Show helpful tooltips when hovering over interface elements."
                      side="top"
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enableTooltips}
                      onChange={(e) => updatePreference('enableTooltips', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Auto-navigate After Save</span>
                    <InfoTooltip 
                      content="Automatically return to the spaces page after saving a recording."
                      side="top"
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.autoNavigateAfterSave}
                      onChange={(e) => updatePreference('autoNavigateAfterSave', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Confirm Before Delete</span>
                    <InfoTooltip 
                      content="Show confirmation dialog before deleting spaces or recordings."
                      side="top"
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.confirmBeforeDelete}
                      onChange={(e) => updatePreference('confirmBeforeDelete', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calibration Settings */}
        {activeTab === 'calibration' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Microphone Calibration</h3>
                <InfoTooltip 
                  content="Calibrate your microphone for accurate sound level measurements. Requires a calibrated sound level meter."
                  side="right"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Reference Level</label>
                    <InfoTooltip 
                      content="The reference sound pressure level in dB SPL for calibration. 94 dB is standard for most calibrators."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="80"
                      max="120"
                      step="1"
                      value={preferences.referenceLevel}
                      onChange={(e) => updatePreference('referenceLevel', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-16">{preferences.referenceLevel} dB</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Frequency Weighting</label>
                    <InfoTooltip 
                      content="Frequency weighting curve for sound level measurements. A-weighting approximates human hearing sensitivity."
                      side="top"
                    />
                  </div>
                  <select
                    value={preferences.frequencyWeighting}
                    onChange={(e) => updatePreference('frequencyWeighting', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="A">A-weighting (dBA)</option>
                    <option value="C">C-weighting (dBC)</option>
                    <option value="Z">Z-weighting (dBZ)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Calibration Offset</label>
                    <InfoTooltip 
                      content="Current calibration offset in dB. This value is automatically set during calibration."
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="-20"
                      max="20"
                      step="0.1"
                      value={preferences.microphoneCalibration}
                      onChange={(e) => updatePreference('microphoneCalibration', parseFloat(e.target.value))}
                      className="flex-1 px-3 py-2 border rounded-lg bg-background"
                    />
                    <span className="text-sm">dB</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-medium">Last Calibration</label>
                    <InfoTooltip 
                      content="Date and time of the last microphone calibration. Regular calibration ensures measurement accuracy."
                      side="top"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {preferences.calibrationDate 
                      ? new Date(preferences.calibrationDate).toLocaleString()
                      : 'Never calibrated'
                    }
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Calibration Instructions</h4>
                <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                  <li>Connect a calibrated measurement microphone to your device</li>
                  <li>Position the microphone at the same distance as your sound level meter</li>
                  <li>Click "Run Calibration" and listen for the 1kHz calibration tone</li>
                  <li>Measure the sound level with your calibrated meter</li>
                  <li>Enter the measured value when prompted</li>
                </ol>
              </div>

              <div className="mt-4 flex gap-3">
                <Button onClick={runCalibration} className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Run Calibration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    updatePreference('microphoneCalibration', 0)
                    updatePreference('calibrationDate', null)
                  }}
                >
                  Reset Calibration
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          
          {hasChanges && (
            <div className="text-sm text-muted-foreground">
              You have unsaved changes
            </div>
          )}
        </div>
      </main>
    </div>
  )
}