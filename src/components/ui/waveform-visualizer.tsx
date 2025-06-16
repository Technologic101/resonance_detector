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
      
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, displayHeight)
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)')
      gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, displayWidth, displayHeight)
      
      if (!isRecording) {
        // Draw static line when not recording
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(0, displayHeight / 2)
        ctx.lineTo(displayWidth, displayHeight / 2)
        ctx.stroke()
        ctx.setLineDash([])
        
        // Draw "Ready" text with glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.font = 'bold 16px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(102, 126, 234, 0.5)'
        ctx.shadowBlur = 10
        ctx.fillText('Ready to record', displayWidth / 2, displayHeight / 2 - 15)
        ctx.shadowBlur = 0
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

    // Draw background grid with subtle glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 4])
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i * height) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    ctx.setLineDash([])

    // Draw waveform with gradient and glow
    if (dataRef.current.length > 1) {
      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)')
      gradient.addColorStop(0.5, 'rgba(240, 147, 251, 0.9)')
      gradient.addColorStop(1, 'rgba(245, 87, 108, 0.8)')
      
      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.shadowColor = 'rgba(102, 126, 234, 0.5)'
      ctx.shadowBlur = 8
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
      ctx.shadowBlur = 0
    }

    // Draw current level indicator with glow
    const currentY = height / 2 + (currentLevel - 0.5) * height * 0.8
    const indicatorGradient = ctx.createRadialGradient(width - 15, currentY, 0, width - 15, currentY, 8)
    indicatorGradient.addColorStop(0, 'rgba(245, 87, 108, 1)')
    indicatorGradient.addColorStop(1, 'rgba(245, 87, 108, 0.3)')
    
    ctx.fillStyle = indicatorGradient
    ctx.beginPath()
    ctx.arc(width - 15, currentY, 6, 0, 2 * Math.PI)
    ctx.fill()

    // Draw level text with background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(width - 60, currentY - 20, 40, 16)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${(currentLevel * 100).toFixed(0)}%`, width - 40, currentY - 8)
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

    // Draw frequency bars with gradients
    const barWidth = width / bufferLength * 2
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.8
      
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)')
      gradient.addColorStop(0.5, 'rgba(240, 147, 251, 0.9)')
      gradient.addColorStop(1, 'rgba(245, 87, 108, 1)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)
      
      x += barWidth + 1
    }

    // Draw frequency labels with glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 3
    
    const sampleRate = audioContext?.sampleRate || 48000
    const nyquist = sampleRate / 2
    
    for (let i = 0; i <= 4; i++) {
      const freq = (i * nyquist) / 4
      const x = (i * width) / 4
      const label = freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : `${freq.toFixed(0)}`
      ctx.fillText(label, x, height - 8)
    }
    ctx.shadowBlur = 0
  }

  // Reset data when recording stops
  useEffect(() => {
    if (!isRecording) {
      dataRef.current = []
    }
  }, [isRecording])

  return (
    <div className={`glass-card rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">Audio Visualization</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVisualizationMode('waveform')}
              className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                visualizationMode === 'waveform' 
                  ? 'gradient-primary text-white shadow-lg' 
                  : 'glass border border-white/20 text-muted-foreground hover:text-white hover:bg-white/10'
              }`}
            >
              Waveform
            </button>
            <button
              onClick={() => setVisualizationMode('frequency')}
              disabled={!analyserNode}
              className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                visualizationMode === 'frequency' 
                  ? 'gradient-primary text-white shadow-lg' 
                  : 'glass border border-white/20 text-muted-foreground hover:text-white hover:bg-white/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Spectrum
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isRecording ? 'bg-red-500 animate-pulse glow' : 'bg-gray-400'
            }`} />
            <span className="text-xs text-muted-foreground font-medium">
              {isRecording ? 'Recording' : 'Ready'}
            </span>
          </div>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full h-32 rounded-xl border border-white/10"
        style={{ width: '100%', height: '128px' }}
      />
      
      <div className="mt-3 flex justify-between text-xs text-muted-foreground font-medium">
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