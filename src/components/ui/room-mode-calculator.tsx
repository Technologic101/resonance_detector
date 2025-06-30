"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { calculateRoomModes, calculateSchroederFrequency, calculateReverbTime } from '@/lib/utils/analysis-utils'
import { formatFrequency } from '@/lib/utils/space-utils'

interface RoomModeCalculatorProps {
  className?: string
}

export function RoomModeCalculator({ className = '' }: RoomModeCalculatorProps) {
  const [dimensions, setDimensions] = useState({
    length: 5,
    width: 4,
    height: 2.5
  })
  const [absorption, setAbsorption] = useState(0.3) // Average absorption coefficient
  const [showResults, setShowResults] = useState(false)
  const [roomModes, setRoomModes] = useState<{
    axial: number[],
    tangential: number[],
    oblique: number[]
  } | null>(null)
  
  const handleCalculate = () => {
    const modes = calculateRoomModes(
      dimensions.length,
      dimensions.width,
      dimensions.height
    )
    setRoomModes(modes)
    setShowResults(true)
  }
  
  // Calculate room volume
  const volume = dimensions.length * dimensions.width * dimensions.height
  
  // Calculate total surface area
  const surfaceArea = 2 * (
    dimensions.length * dimensions.width +
    dimensions.length * dimensions.height +
    dimensions.width * dimensions.height
  )
  
  // Calculate total absorption
  const totalAbsorption = surfaceArea * absorption
  
  // Calculate reverberation time
  const reverbTime = calculateReverbTime(volume, totalAbsorption)
  
  // Calculate Schroeder frequency
  const schroederFreq = calculateSchroederFrequency(volume, reverbTime)
  
  return (
    <div className={`bg-card border rounded-lg p-6 ${className}`}>
      <h3 className="font-semibold mb-4">Room Mode Calculator</h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Room Dimensions (meters)</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Length</label>
              <input
                type="number"
                min="1"
                max="30"
                step="0.1"
                value={dimensions.length}
                onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-1 border rounded-md bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Width</label>
              <input
                type="number"
                min="1"
                max="30"
                step="0.1"
                value={dimensions.width}
                onChange={(e) => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-1 border rounded-md bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Height</label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={dimensions.height}
                onChange={(e) => setDimensions({...dimensions, height: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-1 border rounded-md bg-background text-sm"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Average Absorption Coefficient</label>
          <input
            type="range"
            min="0.05"
            max="0.95"
            step="0.05"
            value={absorption}
            onChange={(e) => setAbsorption(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.05 (Reflective)</span>
            <span>{absorption.toFixed(2)}</span>
            <span>0.95 (Absorptive)</span>
          </div>
        </div>
        
        <Button onClick={handleCalculate} className="w-full">
          Calculate Room Modes
        </Button>
      </div>
      
      {showResults && roomModes && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Room Volume</div>
              <div className="font-semibold">{volume.toFixed(1)} m³</div>
            </div>
            <div className="bg-background p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Schroeder Frequency</div>
              <div className="font-semibold">{formatFrequency(schroederFreq)}</div>
            </div>
            <div className="bg-background p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Reverberation Time</div>
              <div className="font-semibold">{reverbTime.toFixed(2)} seconds</div>
            </div>
            <div className="bg-background p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Surface Area</div>
              <div className="font-semibold">{surfaceArea.toFixed(1)} m²</div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Axial Modes (1D)</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {roomModes.axial.slice(0, 10).map((freq, index) => (
                <div key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                  {formatFrequency(freq)}
                </div>
              ))}
              {roomModes.axial.length > 10 && (
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-xs">
                  +{roomModes.axial.length - 10} more
                </div>
              )}
            </div>
            
            <h4 className="text-sm font-medium mb-2">Tangential Modes (2D)</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {roomModes.tangential.slice(0, 8).map((freq, index) => (
                <div key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">
                  {formatFrequency(freq)}
                </div>
              ))}
              {roomModes.tangential.length > 8 && (
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-xs">
                  +{roomModes.tangential.length - 8} more
                </div>
              )}
            </div>
            
            <h4 className="text-sm font-medium mb-2">Oblique Modes (3D)</h4>
            <div className="flex flex-wrap gap-2">
              {roomModes.oblique.slice(0, 6).map((freq, index) => (
                <div key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs">
                  {formatFrequency(freq)}
                </div>
              ))}
              {roomModes.oblique.length > 6 && (
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-xs">
                  +{roomModes.oblique.length - 6} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}