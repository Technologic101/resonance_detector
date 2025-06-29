"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { InfoTooltip } from '@/components/ui/tooltip'
import { BarChart3, ArrowLeft, Filter, Download, Waves, Zap, Info } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { useSamples } from '@/lib/hooks/use-database'
import { SoundType, SignalQuality } from '@/lib/types'
import { formatDateTime, getSoundTypeLabel, getSignalQualityBgColor, formatFrequency } from '@/lib/utils/space-utils'

export function AnalysisPage() {
  const { setCurrentPage, navigateToSample, navigationState } = useNavigation()
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(navigationState.selectedSampleId || null)
  const { samples, loading } = useSamples()
  const [filterType, setFilterType] = useState<SoundType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'quality'>('date')
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort samples
  const filteredSamples = samples
    .filter(sample => filterType === 'all' || sample.soundType === filterType)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.recordedAt.getTime() - a.recordedAt.getTime()
      } else {
        // Sort by quality (excellent > good > fair > poor)
        const qualityOrder = { 
          [SignalQuality.EXCELLENT]: 0, 
          [SignalQuality.GOOD]: 1, 
          [SignalQuality.FAIR]: 2, 
          [SignalQuality.POOR]: 3 
        }
        return qualityOrder[a.signalQuality] - qualityOrder[b.signalQuality]
      }
    })

  // Get the selected sample
  const selectedSample = selectedSampleId 
    ? samples.find(s => s.id === selectedSampleId) 
    : null

  // Handle sample selection
  const handleSelectSample = (id: string) => {
    setSelectedSampleId(id)
    navigateToSample(id)
  }

  // Export analysis data as JSON
  const handleExportData = () => {
    if (!selectedSample) return
    
    const data = {
      id: selectedSample.id,
      recordedAt: selectedSample.recordedAt,
      duration: selectedSample.duration,
      soundType: selectedSample.soundType,
      signalQuality: selectedSample.signalQuality,
      peaks: selectedSample.peaks,
      spectralData: selectedSample.spectralData
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-${selectedSample.id.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Analysis</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-primary/10' : ''}
            >
              <Filter className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Sound Type</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as SoundType | 'all')}
                  className="px-3 py-1 border rounded-md bg-background text-sm"
                >
                  <option value="all">All Types</option>
                  {Object.values(SoundType).map(type => (
                    <option key={type} value={type}>{getSoundTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Sort By</label>
                <div className="flex rounded-md overflow-hidden border">
                  <button 
                    className={`px-3 py-1 text-sm ${sortBy === 'date' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                    onClick={() => setSortBy('date')}
                  >
                    Date
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm ${sortBy === 'quality' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                    onClick={() => setSortBy('quality')}
                  >
                    Quality
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Samples List */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Recordings</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-pulse text-muted-foreground">Loading recordings...</div>
                </div>
              ) : filteredSamples.length === 0 ? (
                <div className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recordings found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filterType !== 'all' 
                      ? `No ${getSoundTypeLabel(filterType as SoundType).toLowerCase()} recordings found.` 
                      : 'Record some audio samples to analyze them.'}
                  </p>
                  <Button onClick={() => setCurrentPage('recording')}>
                    Record New Sample
                  </Button>
                </div>
              ) : (
                <div className="divide-y max-h-[70vh] overflow-y-auto">
                  {filteredSamples.map(sample => (
                    <button
                      key={sample.id}
                      className={`w-full text-left p-4 hover:bg-accent/50 transition-colors ${
                        selectedSampleId === sample.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => handleSelectSample(sample.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">{getSoundTypeLabel(sample.soundType)}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSignalQualityBgColor(sample.signalQuality)}`}>
                          {sample.signalQuality.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(sample.recordedAt)}
                      </div>
                      <div className="text-sm mt-1 flex items-center gap-2">
                        <span className="text-primary">{sample.duration.toFixed(1)}s</span>
                        {sample.peaks.length > 0 && (
                          <span>{sample.peaks.length} peaks detected</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Analysis Details */}
          <div className="lg:col-span-2">
            {!selectedSample ? (
              <div className="bg-card border rounded-lg p-8 text-center h-full flex flex-col items-center justify-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Select a Recording to Analyze</h2>
                <p className="text-muted-foreground max-w-md">
                  Choose a recording from the list to view detailed frequency analysis and resonance data.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sample Overview */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{getSoundTypeLabel(selectedSample.soundType)} Analysis</h2>
                      <InfoTooltip 
                        content="This section shows basic information about your recording including duration, signal quality, and recording conditions."
                        side="right"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-background p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Duration
                        <InfoTooltip 
                          content="The length of your recording in seconds. Longer recordings may capture more frequency information."
                          side="top"
                        />
                      </div>
                      <div className="font-semibold">{selectedSample.duration.toFixed(1)}s</div>
                    </div>
                    <div className="bg-background p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Signal Quality
                        <InfoTooltip 
                          content="Overall quality of the recording based on signal strength, noise levels, and frequency content. Higher quality recordings provide more accurate analysis."
                          side="top"
                        />
                      </div>
                      <div className="font-semibold">{selectedSample.signalQuality.toUpperCase()}</div>
                    </div>
                    <div className="bg-background p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Ambient Noise
                        <InfoTooltip 
                          content="Background noise level during recording. Lower values indicate cleaner recordings with less interference."
                          side="top"
                        />
                      </div>
                      <div className="font-semibold">{selectedSample.ambientNoiseLevel.toFixed(1)}%</div>
                    </div>
                    <div className="bg-background p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Sample Rate
                        <InfoTooltip 
                          content="How many audio samples per second were captured. Higher sample rates can capture higher frequencies (up to half the sample rate)."
                          side="top"
                        />
                      </div>
                      <div className="font-semibold">{(selectedSample.sampleRate / 1000).toFixed(1)} kHz</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Recorded on {formatDateTime(selectedSample.recordedAt)}
                  </div>
                </div>
                
                {/* Frequency Peaks */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-primary" />
                      Frequency Peaks
                    </h3>
                    <InfoTooltip 
                      content="Dominant frequencies detected in your recording. These peaks may indicate resonances, structural vibrations, or acoustic characteristics of the space."
                      side="right"
                    />
                  </div>
                  
                  {selectedSample.peaks.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No significant frequency peaks detected
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">
                                <div className="flex items-center gap-1">
                                  Frequency
                                  <InfoTooltip 
                                    content="The specific frequency where a peak was detected, measured in Hertz (Hz) or kilohertz (kHz)."
                                    side="top"
                                  />
                                </div>
                              </th>
                              <th className="text-left py-2 font-medium">
                                <div className="flex items-center gap-1">
                                  Amplitude
                                  <InfoTooltip 
                                    content="The strength or loudness of the frequency peak. Higher values indicate stronger resonances."
                                    side="top"
                                  />
                                </div>
                              </th>
                              <th className="text-left py-2 font-medium">
                                <div className="flex items-center gap-1">
                                  Prominence
                                  <InfoTooltip 
                                    content="How much the peak stands out from surrounding frequencies. Higher prominence indicates more distinct resonances."
                                    side="top"
                                  />
                                </div>
                              </th>
                              <th className="text-left py-2 font-medium">
                                <div className="flex items-center gap-1">
                                  Classification
                                  <InfoTooltip 
                                    content="Frequency range category: sub-bass (20-60Hz), bass (60-250Hz), mid (250-4kHz), high-mid (4-8kHz), or brilliance (8kHz+)."
                                    side="top"
                                  />
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSample.peaks.slice(0, 10).map((peak, index) => (
                              <tr key={peak.id} className="border-b last:border-0">
                                <td className="py-2">{formatFrequency(peak.frequency)}</td>
                                <td className="py-2">{peak.amplitude.toFixed(1)}</td>
                                <td className="py-2">{peak.prominence.toFixed(1)}</td>
                                <td className="py-2">{peak.classification || 'Unknown'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {selectedSample.peaks.length > 10 && (
                        <div className="text-center mt-2 text-sm text-muted-foreground">
                          Showing top 10 of {selectedSample.peaks.length} peaks
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Frequency Visualization */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold flex items-center">
                      <Waves className="h-5 w-5 mr-2 text-primary" />
                      Frequency Spectrum
                    </h3>
                    <InfoTooltip 
                      content="Visual representation of frequency content in your recording. Taller bars indicate stronger frequencies. Colors represent different frequency ranges."
                      side="right"
                    />
                  </div>
                  
                  <div className="relative h-64 bg-background rounded-lg border overflow-hidden">
                    {selectedSample.peaks.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        No frequency data available
                      </div>
                    ) : (
                      <>
                        {/* Frequency bars */}
                        <div className="absolute inset-0 flex items-end px-4 pb-8">
                          {selectedSample.peaks.slice(0, 20).map((peak, index) => {
                            const height = `${Math.min(85, (peak.amplitude / 255) * 100)}%`;
                            const width = `${Math.max(2, 100 / Math.min(20, selectedSample.peaks.length) - 1)}%`;
                            
                            // Color based on classification
                            let bgColor = 'bg-blue-500';
                            if (peak.classification === 'bass' || peak.classification === 'sub-bass') {
                              bgColor = 'bg-purple-500';
                            } else if (peak.classification === 'low-mid' || peak.classification === 'mid') {
                              bgColor = 'bg-green-500';
                            } else if (peak.classification === 'high-mid' || peak.classification === 'presence') {
                              bgColor = 'bg-yellow-500';
                            } else if (peak.classification === 'brilliance') {
                              bgColor = 'bg-red-500';
                            }
                            
                            return (
                              <div 
                                key={peak.id}
                                className={`relative mx-0.5 rounded-t ${bgColor}`}
                                style={{ height, width }}
                                title={`${formatFrequency(peak.frequency)} - Amplitude: ${peak.amplitude.toFixed(1)}`}
                              >
                                {index < 5 && (
                                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
                                    {formatFrequency(peak.frequency)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* X-axis labels */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 flex justify-between px-4 text-xs text-muted-foreground">
                          <span>0 Hz</span>
                          <span>Frequency</span>
                          <span>{(selectedSample.sampleRate / 2 / 1000).toFixed(1)} kHz</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Resonance Analysis */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Resonance Analysis
                    </h3>
                    <InfoTooltip 
                      content="Advanced acoustic analysis including fundamental frequency, harmonics, and signal quality metrics. These help identify structural resonances and acoustic properties."
                      side="right"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    {selectedSample.spectralData && (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {selectedSample.spectralData.fundamentalFrequency && (
                            <div className="bg-background p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                Fundamental
                                <InfoTooltip 
                                  content="The lowest, most prominent frequency in the recording. Often indicates the primary resonance of the space or structure."
                                  side="top"
                                />
                              </div>
                              <div className="font-semibold">
                                {formatFrequency(selectedSample.spectralData.fundamentalFrequency)}
                              </div>
                            </div>
                          )}
                          
                          {selectedSample.spectralData.snr !== undefined && (
                            <div className="bg-background p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                Signal-to-Noise
                                <InfoTooltip 
                                  content="Ratio of signal strength to background noise in decibels (dB). Higher values indicate cleaner recordings with less interference."
                                  side="top"
                                />
                              </div>
                              <div className="font-semibold">
                                {selectedSample.spectralData.snr.toFixed(1)} dB
                              </div>
                            </div>
                          )}
                          
                          {selectedSample.spectralData.thd !== undefined && (
                            <div className="bg-background p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                THD
                                <InfoTooltip 
                                  content="Total Harmonic Distortion - measures how much the signal deviates from a pure tone. Lower values indicate cleaner, more accurate recordings."
                                  side="top"
                                />
                              </div>
                              <div className="font-semibold">
                                {selectedSample.spectralData.thd.toFixed(2)}%
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {selectedSample.spectralData.harmonics && selectedSample.spectralData.harmonics.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 mb-2">
                              <h4 className="text-sm font-medium">Harmonic Frequencies</h4>
                              <InfoTooltip 
                                content="Frequencies that are mathematical multiples of the fundamental frequency. These indicate resonant modes and acoustic characteristics of the space."
                                side="right"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedSample.spectralData.harmonics.map((freq, index) => (
                                <div key={index} className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                                  {formatFrequency(freq)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="border-t pt-4 mt-4">
                          <div className="flex items-center gap-1 mb-2">
                            <h4 className="text-sm font-medium">Interpretation</h4>
                            <InfoTooltip 
                              content="AI-generated analysis of your recording results, providing insights into potential acoustic issues, resonances, and recommendations for further analysis."
                              side="right"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getResonanceInterpretation(selectedSample)}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {(!selectedSample.spectralData || Object.keys(selectedSample.spectralData).length === 0) && (
                      <div className="text-center py-4 text-muted-foreground">
                        No detailed spectral data available for this recording
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Helper function to generate interpretation text based on sample data
function getResonanceInterpretation(sample: any): string {
  if (!sample.peaks || sample.peaks.length === 0) {
    return "No significant resonance detected in this recording.";
  }
  
  // Get the top 3 peaks by amplitude
  const topPeaks = [...sample.peaks].sort((a, b) => b.amplitude - a.amplitude).slice(0, 3);
  
  // Check if there are strong low frequency resonances
  const lowFreqPeaks = topPeaks.filter(p => p.frequency < 200);
  const midFreqPeaks = topPeaks.filter(p => p.frequency >= 200 && p.frequency < 1000);
  const highFreqPeaks = topPeaks.filter(p => p.frequency >= 1000);
  
  let interpretation = "";
  
  if (lowFreqPeaks.length > 0) {
    interpretation += `Strong low frequency resonance detected at ${formatFrequency(lowFreqPeaks[0].frequency)}. `;
    interpretation += "This may indicate structural vibrations or HVAC system issues. ";
  }
  
  if (midFreqPeaks.length > 0) {
    interpretation += `Notable mid-range resonance at ${formatFrequency(midFreqPeaks[0].frequency)}. `;
    interpretation += "This could be related to room dimensions or interior features. ";
  }
  
  if (highFreqPeaks.length > 0) {
    interpretation += `High frequency components at ${formatFrequency(highFreqPeaks[0].frequency)}. `;
    interpretation += "Typically associated with smaller objects or electronic equipment. ";
  }
  
  if (sample.spectralData?.snr !== undefined) {
    if (sample.spectralData.snr > 30) {
      interpretation += "Excellent signal-to-noise ratio indicates clear resonance patterns. ";
    } else if (sample.spectralData.snr > 15) {
      interpretation += "Good signal-to-noise ratio provides reliable analysis. ";
    } else {
      interpretation += "Low signal-to-noise ratio may affect analysis accuracy. Consider re-recording in quieter conditions. ";
    }
  }
  
  if (interpretation === "") {
    interpretation = "Analysis complete. No significant building resonance issues detected in this recording.";
  } else {
    interpretation += "Consider multiple recordings at different locations for comprehensive analysis.";
  }
  
  return interpretation;
}