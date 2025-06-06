"use client"

import { Loader2 } from 'lucide-react'

interface ProcessingOverlayProps {
  isVisible: boolean
  message?: string
  className?: string
}

export function ProcessingOverlay({ 
  isVisible, 
  message = "Processing...", 
  className = "" 
}: ProcessingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="bg-card border rounded-lg p-8 shadow-lg max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Creating Space</h3>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}