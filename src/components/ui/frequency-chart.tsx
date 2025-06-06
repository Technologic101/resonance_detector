"use client"

import { useEffect, useRef } from 'react'
import { FrequencyPeak } from '@/lib/types'
import { formatFrequency } from '@/lib/utils/space-utils'

interface FrequencyChartProps {
  peaks: FrequencyPeak[]
  maxFrequency?: number
  height?: number
  className?: string
}

export function FrequencyChart({ 
  peaks, 
  maxFrequency = 20000, 
  height = 200,
  className = ''
}: FrequencyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size with device pixel ratio for sharp rendering
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height)
    
    // Draw background grid
    drawGrid(ctx, rect.width, height)
    
    // Draw frequency peaks
    if (peaks.length > 0) {
      drawPeaks(ctx, peaks, rect.width, height, maxFrequency)
    } else {
      // Draw "No data" message
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No frequency data available', rect.width / 2, height / 2)
    }
    
  }, [peaks, maxFrequency, height])
  
  // Draw background grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5
    
    // Horizontal grid lines (amplitude)
    for (let i = 0; i <= 5; i++) {
      const y = height - (i * height / 5)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
      
      // Add amplitude labels
      if (i > 0) {
        ctx.fillStyle = '#9ca3af'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${i * 20}%`, 5, y - 3)
      }
    }
    
    // Vertical grid lines (frequency)
    const freqSteps = [0, 100, 250, 500, 1000, 2000, 5000, 10000, 20000]
    for (const freq of freqSteps) {
      if (freq > maxFrequency) break
      
      const x = (freq / maxFrequency) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
      
      // Add frequency labels
      ctx.fillStyle = '#9ca3af'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(formatFrequency(freq), x, height - 5)
    }
  }
  
  // Draw frequency peaks
  const drawPeaks = (
    ctx: CanvasRenderingContext2D, 
    peaks: FrequencyPeak[], 
    width: number, 
    height: number,
    maxFreq: number
  ) => {
    // Find max amplitude for scaling
    const maxAmplitude = Math.max(...peaks.map(p => p.amplitude), 100)
    
    // Draw peaks
    peaks.forEach(peak => {
      if (peak.frequency > maxFreq) return
      
      const x = (peak.frequency / maxFreq) * width
      const barHeight = (peak.amplitude / maxAmplitude) * (height - 30)
      
      // Determine color based on classification
      let color = '#3b82f6' // Default blue
      if (peak.classification === 'sub-bass' || peak.classification === 'bass') {
        color = '#8b5cf6' // Purple
      } else if (peak.classification === 'low-mid' || peak.classification === 'mid') {
        color = '#10b981' // Green
      } else if (peak.classification === 'high-mid' || peak.classification === 'presence') {
        color = '#f59e0b' // Yellow
      } else if (peak.classification === 'brilliance') {
        color = '#ef4444' // Red
      }
      
      // Draw bar
      ctx.fillStyle = color
      ctx.fillRect(
        x - 2, 
        height - barHeight - 20, 
        4, 
        barHeight
      )
      
      // Draw peak label for prominent peaks
      if (peak.amplitude > maxAmplitude * 0.7) {
        ctx.fillStyle = '#1f2937'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          formatFrequency(peak.frequency), 
          x, 
          height - barHeight - 25
        )
      }
    })
    
    // Draw legend
    const legendItems = [
      { label: 'Bass', color: '#8b5cf6' },
      { label: 'Mid', color: '#10b981' },
      { label: 'High', color: '#f59e0b' },
      { label: 'Brilliance', color: '#ef4444' }
    ]
    
    let legendX = 10
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    
    legendItems.forEach(item => {
      ctx.fillStyle = item.color
      ctx.fillRect(legendX, 10, 10, 10)
      
      ctx.fillStyle = '#4b5563'
      ctx.fillText(item.label, legendX + 15, 18)
      
      legendX += ctx.measureText(item.label).width + 30
    })
  }
  
  return (
    <div className={className}>
      <canvas 
        ref={canvasRef} 
        className="w-full rounded-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}