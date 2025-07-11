"use client"

import { Button } from '@/components/ui/button'
import { FrequencyChart } from '@/components/ui/frequency-chart'
import { InfoTooltip } from '@/components/ui/tooltip'
import { Sample } from '@/lib/types'
import { formatDateTime, getSoundTypeLabel, formatFrequency } from '@/lib/utils/space-utils'
import { Download, Mic, BarChart3, Zap } from 'lucide-react'

interface SampleDetailViewProps {
  sample: Sample
  onExport: () => void
}

export function SampleDetailView({ sample, onExport }: SampleDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Sample Overview */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{getSoundTypeLabel(sample.soundType)} Analysis</h2>
            <InfoTooltip 
              content="Overview of your recording including basic metrics and recording conditions."
              side="right"
            />
          </div>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-background p-3 rounded-lg">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              Signal Quality
              <InfoTooltip 
                content="Overall quality assessment based on signal strength, noise levels, and frequency content."
                side="top"
              />
            </div>
            <div className="font-semibold">{sample.signalQuality.toUpperCase()}</div>
          </div>
          <div className="bg-background p-3 rounded-lg">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              Ambient Noise
              <InfoTooltip 
                content="Background noise level during recording. Lower values indicate cleaner recordings."
                side="top"
              />
            </div>
            <div className="font-semibold">{sample.ambientNoiseLevel.toFixed(1)}%</div>
          </div>
          <div className="bg-background p-3 rounded-lg">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              Sample Rate
              <InfoTooltip 
                content="Audio sampling frequency. Higher rates can capture higher frequencies (up to half the sample rate)."
                side="top"
              />
            </div>
            <div className="font-semibold">{(sample.sampleRate / 1000).toFixed(1)} kHz</div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Recorded on {formatDateTime(sample.recordedAt)}
        </div>
      </div>
      
      {/* Frequency Visualization */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Frequency Spectrum
          </h3>
          <InfoTooltip 
            content="Visual representation of frequency content. Taller bars indicate stronger frequencies. Colors represent different frequency ranges."
            side="right"
          />
        </div>
        
        <FrequencyChart 
          peaks={sample.peaks} 
          maxFrequency={10000} 
          height={240}
        />
      </div>
      
      {/* Frequency Peaks */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold flex items-center">
            <Zap className="h-5 w-5 mr-2 text-primary" />
            Frequency Peaks
          </h3>
          <InfoTooltip 
            content="Dominant frequencies detected in your recording. These may indicate resonances or acoustic characteristics."
            side="right"
          />
        </div>
        
        {sample.peaks.length === 0 ? (
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
                          content="The specific frequency where a peak was detected, measured in Hz or kHz."
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
                          content="Frequency range category: sub-bass, bass, mid, high-mid, or brilliance based on the peak frequency."
                          side="top"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sample.peaks.slice(0, 10).map((peak, index) => (
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
            
            {sample.peaks.length > 10 && (
              <div className="text-center mt-2 text-sm text-muted-foreground">
                Showing top 10 of {sample.peaks.length} peaks
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Advanced Metrics */}
      {sample.spectralData && Object.keys(sample.spectralData).length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold">Advanced Metrics</h3>
            <InfoTooltip 
              content="Detailed acoustic analysis including fundamental frequency, harmonics, and signal quality metrics."
              side="right"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sample.spectralData.fundamentalFrequency && (
              <div className="bg-background p-3 rounded-lg">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  Fundamental
                  <InfoTooltip 
                    content="The lowest, most prominent frequency. Often indicates the primary resonance of the space."
                    side="top"
                  />
                </div>
                <div className="font-semibold">
                  {formatFrequency(sample.spectralData.fundamentalFrequency)}
                </div>
              </div>
            )}
            
            {sample.spectralData.snr !== undefined && (
              <div className="bg-background p-3 rounded-lg">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  Signal-to-Noise
                  <InfoTooltip 
                    content="Ratio of signal strength to background noise in decibels. Higher values indicate cleaner recordings."
                    side="top"
                  />
                </div>
                <div className="font-semibold">
                  {sample.spectralData.snr.toFixed(1)} dB
                </div>
              </div>
            )}
            
            {sample.spectralData.thd !== undefined && (
              <div className="bg-background p-3 rounded-lg">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  THD
                  <InfoTooltip 
                    content="Total Harmonic Distortion - measures signal purity. Lower values indicate cleaner recordings."
                    side="top"
                  />
                </div>
                <div className="font-semibold">
                  {sample.spectralData.thd.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
          
          {sample.spectralData.harmonics && sample.spectralData.harmonics.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1 mb-2">
                <h4 className="text-sm font-medium">Harmonic Frequencies</h4>
                <InfoTooltip 
                  content="Frequencies that are mathematical multiples of the fundamental. These indicate resonant modes and acoustic characteristics."
                  side="right"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {sample.spectralData.harmonics.map((freq, index) => (
                  <div key={index} className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                    {formatFrequency(freq)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}