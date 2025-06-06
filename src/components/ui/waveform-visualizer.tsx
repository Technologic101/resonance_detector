"use client"

import { useEffect, useRef, useState } from 'react'

interface WaveformVisualizerProps {
  level: number
  isRecording: boolean
  audioContext?: AudioContext | null
  analyserNode?: AnalyserNode | null
  className?: string
}

export function WaveformVisualizer({ 
  level, 
  isRecording, 
  audioContext,
  analyserNode,
  className = '' 
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const dataRef = useRef<number[]>([])
  const [visualizationMode, setVisualizationMode] = useState<'waveform' | 'frequency'>('waveform')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const draw = () => {
      const { width, height } = canvas
      const displayWidth = width / window.devicePixelRatio
      const displayHeight = height / window.devicePixelRatio
      
      // Clear canvas
      ctx.clearRect(0, 0, displayWidth, displayHeight)
      
      if (!isRecording) {
        // Draw static line when not recording
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, displayHeight / 2)
        ctx.lineTo(displayWidth, displayHeight / 2)
        ctx.stroke()
        
        // Draw "Ready" text
        ctx.fillStyle = '#9ca3af'
        ctx.font = '14px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Ready to record', displayWidth / 2, displayHeight / 2 - 10)
        return
      }

      if (visualizationMode === 'frequency' && analyserNode) {
        drawFrequencySpectrum(ctx, analyserNode, displayWidth, displayHeight)
      } else {
        drawWaveform(ctx, level, displayWidth, displayHeight)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [level, isRecording, visualizationMode, analyserNode])

  const drawWaveform = (
    ctx: CanvasRenderingContext2D, 
    currentLevel: number, 
    width: number, 
    height: number
  ) => {
    // Add current level to data
    dataRef.current.push(currentLevel)
    
    // Keep only last 200 data points for smooth animation
    if (dataRef.current.length > 200) {
      dataRef.current.shift()
    }

    // Draw background grid
    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i * height) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    ctx.setLineDash([])

    // Draw waveform
    if (dataRef.current.length > 1) {
      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(1, '#1d4ed8')
      
      ctx.strokeStyle = gradient
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
    }

    // Draw current level indicator
    const currentY = height / 2 + (currentLevel - 0.5) * height * 0.8
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(width - 15, currentY, 4, 0, 2 * Math.PI)
    ctx.fill()

    // Draw level text
    ctx.fillStyle = '#374151'
    ctx.font = '12px Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${(currentLevel * 100).toFixed(0)}%`, width - 25, currentY - 10)
  }

  const drawFrequencySpectrum = (
    ctx: CanvasRenderingContext2D,
    analyser: AnalyserNode,
    width: number,
    height: number
  ) => {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    // Draw background
    ctx.fillStyle = '#f9fafb'
    ctx.fillRect(0, 0, width, height)

    // Draw frequency bars
    const barWidth = width / bufferLength * 2
    let x = 0

    const gradient = ctx.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, '#3b82f6')
    gradient.addColorStop(0.5, '#1d4ed8')
    gradient.addColorStop(1, '#1e40af')

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.8
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)
      
      x += barWidth + 1
    }

    // Draw frequency labels
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    
    const sampleRate = audioContext?.sampleRate || 48000
    const nyquist = sampleRate / 2
    
    for (let i = 0; i <= 4; i++) {
      const freq = (i * nyquist) / 4
      const x = (i * width) / 4
      const label = freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : `${freq.toFixed(0)}`
      ctx.fillText(label, x, height - 5)
    }
  }

  // Reset data when recording stops
  useEffect(() => {
    if (!isRecording) {
      dataRef.current = []
    }
  }, [isRecording])

  return (
    <div className={`bg-card border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Audio Visualization</span>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVisualizationMode('waveform')}
              className={`px-2 py-1 text-xs rounded ${
                visualizationMode === 'waveform' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Waveform
            </button>
            <button
              onClick={() => setVisualizationMode('frequency')}
              disabled={!analyserNode}
              className={`px-2 py-1 text-xs rounded ${
                visualizationMode === 'frequency' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Spectrum
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs text-muted-foreground">
              {isRecording ? 'Recording' : 'Ready'}
            </span>
          </div>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full h-32 bg-background rounded border"
        style={{ width: '100%', height: '128px' }}
      />
      
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>
          {visualizationMode === 'waveform' 
            ? `Level: ${(level * 100).toFixed(0)}%` 
            : 'Frequency Spectrum'
          }
        </span>
        <span>
          {visualizationMode === 'waveform' 
            ? `${dataRef.current.length} samples` 
            : `0 - ${audioContext ? (audioContext.sampleRate / 2000).toFixed(1) : '24'}kHz`
          }
        </span>
      </div>
    </div>
  )
}