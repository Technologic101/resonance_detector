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
    <div className="flex items-center justify-center space-x-4">
      {/* Record/Resume Button */}
      {canRecord && (
        <Button
          size="lg"
          onClick={onStart}
          disabled={disabled}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16"
        >
          <Mic className="h-6 w-6" />
        </Button>
      )}
      
      {canResume && (
        <Button
          size="lg"
          onClick={onResume}
          disabled={disabled}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16"
        >
          <Play className="h-6 w-6" />
        </Button>
      )}

      {/* Pause Button */}
      {canPause && (
        <Button
          size="lg"
          variant="outline"
          onClick={onPause}
          disabled={disabled}
          className="rounded-full w-12 h-12"
        >
          <Pause className="h-5 w-5" />
        </Button>
      )}

      {/* Stop Button */}
      {canStop && (
        <Button
          size="lg"
          variant="outline"
          onClick={onStop}
          disabled={disabled}
          className="rounded-full w-12 h-12"
        >
          <Square className="h-5 w-5" />
        </Button>
      )}

      {/* Save Button */}
      {canSave && (
        <Button
          size="lg"
          onClick={onSave}
          disabled={disabled}
          className="rounded-full w-12 h-12"
        >
          <Save className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}