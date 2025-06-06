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
    <div className="space-y-6">
      {/* Main Control Buttons */}
      <div className="flex items-center justify-center space-x-4">
        {/* Record/Resume Button */}
        {canRecord && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={onStart}
              disabled={disabled}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 shadow-lg"
            >
              <Mic className="h-6 w-6" />
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Start Recording</p>
          </div>
        )}
        
        {canResume && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={onResume}
              disabled={disabled}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16 shadow-lg"
            >
              <Play className="h-6 w-6" />
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Resume</p>
          </div>
        )}

        {/* Pause Button */}
        {canPause && (
          <div className="text-center">
            <Button
              size="lg"
              variant="outline"
              onClick={onPause}
              disabled={disabled}
              className="rounded-full w-12 h-12 border-2"
            >
              <Pause className="h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Pause</p>
          </div>
        )}

        {/* Stop Button */}
        {canStop && (
          <div className="text-center">
            <Button
              size="lg"
              variant="outline"
              onClick={onStop}
              disabled={disabled}
              className="rounded-full w-12 h-12 border-2"
            >
              <Square className="h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Stop</p>
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
            className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Save className="h-6 w-6" />
          </Button>
          <p className="text-sm text-muted-foreground mt-2">Save Recording</p>
        </div>
      )}

      {/* Status Indicator */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 
            isPaused ? 'bg-yellow-500' : 
            'bg-gray-300'
          }`} />
          <span className="text-sm font-medium">
            {isRecording ? 'Recording...' : 
             isPaused ? 'Paused' : 
             'Ready'}
          </span>
        </div>
      </div>
    </div>
  )
}