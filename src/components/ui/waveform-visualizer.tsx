"use client"

import { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  level: number
  isRecording: boolean
  className?: string
}

export function WaveformVisualizer({ level, isRecording, className = '' }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const dataRef = useRef<number[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const { width, height } = canvas
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height)
      
      if (!isRecording) {
        // Draw static line when not recording
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()
        return
      }

      // Add current level to data
      dataRef.current.push(level)
      
      // Keep only last 100 data points
      if (dataRef.current.length > 100) {
        dataRef.current.shift()
      }

      // Draw waveform
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.beginPath()

      const stepX = width / Math.max(dataRef.current.length - 1, 1)
      
      dataRef.current.forEach((value, index) => {
        const x = index * stepX
        const y = height / 2 + (value - 0.5) * height * 0.8
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()

      // Draw level indicator
      const currentY = height / 2 + (level - 0.5) * height * 0.8
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(width - 10, currentY, 3, 0, 2 * Math.PI)
      ctx.fill()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [level, isRecording])

  // Reset data when recording stops
  useEffect(() => {
    if (!isRecording) {
      dataRef.current = []
    }
  }, [isRecording])

  return (
    <div className={`bg-card border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Waveform</span>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-xs text-muted-foreground">
            {isRecording ? 'Recording' : 'Ready'}
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="w-full h-24 bg-background rounded border"
      />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>Level: {(level * 100).toFixed(0)}%</span>
        <span>{dataRef.current.length} samples</span>
      </div>
    </div>
  )
}