"use client"

import { Button } from '@/components/ui/button'
import { Mic, Square, Pause, Play, Save } from 'lucide-react'

interface RecordingControlsProps {
  canRecord: boolean
  canPause: boolean
  canResume: boolean
  canStop: boolean
  canSave: boolean
  isRecording: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onSave: () => void
  disabled?: boolean
}

export function RecordingControls({
  canRecord,
  canPause,
  canResume,
  canStop,
  canSave,
  isRecording,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  onSave,
  disabled = false,
}: RecordingControlsProps) {
  return (
    <div className="space-y-8">
      {/* Main Control Buttons */}
      <div className="flex items-center justify-center space-x-6">
        {/* Record/Resume Button */}
        {canRecord && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={onStart}
              disabled={disabled}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-20 h-20 shadow-2xl glow-pulse border-0 hover:scale-105 transition-all duration-300"
            >
              <Mic className="h-8 w-8" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3 font-medium">Start Recording</p>
          </div>
        )}
        
        {canResume && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={onResume}
              disabled={disabled}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full w-20 h-20 shadow-2xl glow border-0 hover:scale-105 transition-all duration-300"
            >
              <Play className="h-8 w-8" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3 font-medium">Resume</p>
          </div>
        )}

        {/* Pause Button */}
        {canPause && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={onPause}
              disabled={disabled}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-full w-16 h-16 shadow-xl hover:scale-105 transition-all duration-300 border-0"
            >
              <Pause className="h-6 w-6" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3 font-medium">Pause</p>
          </div>
        )}

        {/* Stop Button - Made RED */}
        {canStop && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={onStop}
              disabled={disabled}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full w-16 h-16 shadow-xl hover:scale-105 transition-all duration-300 border-0"
            >
              <Square className="h-6 w-6" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3 font-medium">Stop</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      {canSave && (
        <div className="text-center">
          <Button
            size="lg"
            onClick={onSave}
            disabled={disabled}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-full w-18 h-18 shadow-2xl glow border-0 hover:scale-105 transition-all duration-300"
          >
            <Save className="h-8 w-8" />
          </Button>
          <p className="text-sm text-muted-foreground mt-3 font-medium">Save Recording</p>
        </div>
      )}

      {/* Status Indicator */}
      <div className="text-center">
        <div className="glass-card rounded-xl p-4 inline-block">
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
              isRecording ? 'bg-red-500 animate-pulse glow' : 
              isPaused ? 'bg-yellow-500 glow' : 
              'bg-gray-400'
            }`} />
            <span className="text-lg font-semibold">
              {isRecording ? 'Recording...' : 
               isPaused ? 'Paused' : 
               'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}