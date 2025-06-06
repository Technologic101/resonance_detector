"use client"

import { Button } from '@/components/ui/button'
import { FrequencyChart } from '@/components/ui/frequency-chart'
import { Sample } from '@/lib/types'
import { formatDateTime, getSoundTypeLabel, formatFrequency } from '@/lib/utils/space-utils'
import { generateAnalysisText } from '@/lib/utils/analysis-utils'
import { Download, Mic, BarChart3, Zap, Info } from 'lucide-react'

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
          <h2 className="text-xl font-semibold">{getSoundTypeLabel(sample.soundType)} Analysis</h2>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-background p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Duration</div>
            <div className="font-semibold">{sample.duration.toFixed(1)}s</div>
          </div>
          <div className="bg-background p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Signal Quality</div>
            <div className="font-semibold">{sample.signalQuality.toUpperCase()}</div>
          </div>
          <div className="bg-background p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Ambient Noise</div>
            <div className="font-semibold">{sample.ambientNoiseLevel.toFixed(1)}%</div>
          </div>
          <div className="bg-background p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Sample Rate</div>
            <div className="font-semibold">{(sample.sampleRate / 1000).toFixed(1)} kHz</div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Recorded on {formatDateTime(sample.recordedAt)}
        </div>
      </div>
      
      {/* Frequency Visualization */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Frequency Spectrum
        </h3>
        
        <FrequencyChart 
          peaks={sample.peaks} 
          maxFrequency={10000} 
          height={240}
        />
      </div>
      
      {/* Frequency Peaks */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-primary" />
          Frequency Peaks
        </h3>
        
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
                    <th className="text-left py-2 font-medium">Frequency</th>
                    <th className="text-left py-2 font-medium">Amplitude</th>
                    <th className="text-left py-2 font-medium">Prominence</th>
                    <th className="text-left py-2 font-medium">Classification</th>
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
      
      {/* Resonance Analysis */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2 text-primary" />
          Resonance Analysis
        </h3>
        
        <div className="space-y-4">
          {sample.spectralData && Object.keys(sample.spectralData).length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sample.spectralData.fundamentalFrequency && (
                  <div className="bg-background p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Fundamental</div>
                    <div className="font-semibold">
                      {formatFrequency(sample.spectralData.fundamentalFrequency)}
                    </div>
                  </div>
                )}
                
                {sample.spectralData.snr !== undefined && (
                  <div className="bg-background p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Signal-to-Noise</div>
                    <div className="font-semibold">
                      {sample.spectralData.snr.toFixed(1)} dB
                    </div>
                  </div>
                )}
                
                {sample.spectralData.thd !== undefined && (
                  <div className="bg-background p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">THD</div>
                    <div className="font-semibold">
                      {sample.spectralData.thd.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
              
              {sample.spectralData.harmonics && sample.spectralData.harmonics.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Harmonic Frequencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {sample.spectralData.harmonics.map((freq, index) => (
                      <div key={index} className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                        {formatFrequency(freq)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-2">Interpretation</h4>
                <p className="text-sm text-muted-foreground">
                  {generateAnalysisText(sample)}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No detailed spectral data available for this recording
            </div>
          )}
        </div>
      </div>
    </div>
  )
}