"use client"

import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, className = '', side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(true)
  }

  const hideTooltip = () => {
    if (isMobile) {
      // On mobile, hide after a delay
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 3000)
    } else {
      setIsVisible(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault()
      e.stopPropagation()
      if (isVisible) {
        hideTooltip()
      } else {
        showTooltip()
      }
    }
  }

  const getTooltipPosition = () => {
    switch (side) {
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default: // top
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  const getArrowPosition = () => {
    switch (side) {
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-900 dark:border-b-gray-100'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-900 dark:border-l-gray-100'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-900 dark:border-r-gray-100'
      default: // top
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100'
    }
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={!isMobile ? showTooltip : undefined}
      onMouseLeave={!isMobile ? hideTooltip : undefined}
      onClick={handleClick}
    >
      {children}
      
      {isVisible && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div 
              className="fixed inset-0 z-40 bg-transparent"
              onClick={hideTooltip}
            />
          )}
          
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-lg max-w-xs whitespace-normal ${getTooltipPosition()}`}
            style={{ wordBreak: 'break-word' }}
          >
            {content}
            
            {/* Arrow */}
            <div 
              className={`absolute w-0 h-0 border-4 ${getArrowPosition()}`}
            />
          </div>
        </>
      )}
    </div>
  )
}

interface InfoTooltipProps {
  content: string
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function InfoTooltip({ content, className = '', side = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} side={side} className={className}>
      <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
    </Tooltip>
  )
}