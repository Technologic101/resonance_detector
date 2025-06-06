"use client"

interface LevelMeterProps {
  level: number
  peak?: number
  rms?: number
  className?: string
}

export function LevelMeter({ level, peak = 0, rms = 0, className = '' }: LevelMeterProps) {
  const percentage = Math.min(level * 100, 100)
  const peakPercentage = Math.min(peak * 100, 100)
  const rmsPercentage = Math.min(rms * 100, 100)

  const getColorClass = (value: number) => {
    if (value > 90) return 'bg-red-500'
    if (value > 75) return 'bg-yellow-500'
    if (value > 50) return 'bg-green-500'
    return 'bg-blue-500'
  }

  const getSegmentColor = (index: number, totalSegments: number) => {
    const segmentPercentage = (index / totalSegments) * 100
    if (segmentPercentage > 85) return 'bg-red-500'
    if (segmentPercentage > 70) return 'bg-yellow-500'
    if (segmentPercentage > 40) return 'bg-green-500'
    return 'bg-blue-500'
  }

  const totalSegments = 20
  const activeSegments = Math.floor((percentage / 100) * totalSegments)

  return (
    <div className={`bg-card border rounded-lg p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Input Level</span>
        <div className="flex items-center space-x-4 text-xs">
          <span className="text-muted-foreground">
            Peak: {peakPercentage.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">
            RMS: {rmsPercentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Segmented Level Meter */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalSegments }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-4 rounded-sm transition-all duration-75 ${
                i < activeSegments
                  ? getSegmentColor(i, totalSegments)
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        {/* Peak indicator overlay */}
        {peak > 0 && (
          <div className="relative h-1">
            <div
              className="absolute top-0 w-1 h-full bg-white border border-gray-400 transition-all duration-200"
              style={{ left: `${peakPercentage}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Continuous Level Bar */}
      <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* RMS level (background) */}
        {rms > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-blue-300 dark:bg-blue-600 transition-all duration-150"
            style={{ width: `${rmsPercentage}%` }}
          />
        )}
        
        {/* Current level */}
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-75 ${getColorClass(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Peak indicator */}
        {peak > 0 && (
          <div
            className="absolute top-0 w-1 h-full bg-white border border-gray-400 transition-all duration-200"
            style={{ left: `${peakPercentage}%` }}
          />
        )}
        
        {/* Level text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white drop-shadow-sm">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Scale markers */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span className="text-red-600">100%</span>
      </div>
      
      {/* Quality indicators */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="text-muted-foreground">Signal</div>
          <div className={`font-medium ${
            percentage > 10 ? 'text-green-600' : 'text-red-600'
          }`}>
            {percentage > 10 ? 'Good' : 'Low'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Clipping</div>
          <div className={`font-medium ${
            percentage > 95 ? 'text-red-600' : 'text-green-600'
          }`}>
            {percentage > 95 ? 'Yes' : 'No'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Dynamic</div>
          <div className={`font-medium ${
            peak - rms > 0.2 ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {peak - rms > 0.2 ? 'Good' : 'Limited'}
          </div>
        </div>
      </div>
    </div>
  )
}