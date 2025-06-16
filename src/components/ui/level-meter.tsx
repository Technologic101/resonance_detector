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
    if (value > 90) return 'from-red-400 to-red-600'
    if (value > 75) return 'from-yellow-400 to-orange-500'
    if (value > 50) return 'from-green-400 to-emerald-500'
    return 'from-blue-400 to-cyan-500'
  }

  const getSegmentColor = (index: number, totalSegments: number) => {
    const segmentPercentage = (index / totalSegments) * 100
    if (segmentPercentage > 85) return 'bg-gradient-to-t from-red-400 to-red-600'
    if (segmentPercentage > 70) return 'bg-gradient-to-t from-yellow-400 to-orange-500'
    if (segmentPercentage > 40) return 'bg-gradient-to-t from-green-400 to-emerald-500'
    return 'bg-gradient-to-t from-blue-400 to-cyan-500'
  }

  const totalSegments = 20
  const activeSegments = Math.floor((percentage / 100) * totalSegments)

  return (
    <div className={`glass-card rounded-2xl p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-lg">Input Level</span>
        <div className="flex items-center space-x-4 text-xs">
          <span className="text-muted-foreground font-medium">
            Peak: <span className="text-white">{peakPercentage.toFixed(0)}%</span>
          </span>
          <span className="text-muted-foreground font-medium">
            RMS: <span className="text-white">{rmsPercentage.toFixed(0)}%</span>
          </span>
        </div>
      </div>
      
      {/* Segmented Level Meter */}
      <div className="space-y-3">
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalSegments }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-5 rounded-sm transition-all duration-75 ${
                i < activeSegments
                  ? getSegmentColor(i, totalSegments)
                  : 'bg-gray-200/20 dark:bg-gray-700/20'
              }`}
            />
          ))}
        </div>
        
        {/* Peak indicator overlay */}
        {peak > 0 && (
          <div className="relative h-1">
            <div
              className="absolute top-0 w-1 h-full bg-white border border-gray-400 rounded-full transition-all duration-200 glow"
              style={{ left: `${peakPercentage}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Continuous Level Bar */}
      <div className="relative h-8 bg-gray-200/20 dark:bg-gray-700/20 rounded-full overflow-hidden">
        {/* RMS level (background) */}
        {rms > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-300/50 to-cyan-400/50 transition-all duration-150 rounded-full"
            style={{ width: `${rmsPercentage}%` }}
          />
        )}
        
        {/* Current level */}
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-75 bg-gradient-to-r ${getColorClass(percentage)} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Peak indicator */}
        {peak > 0 && (
          <div
            className="absolute top-0 w-1 h-full bg-white border border-gray-400 rounded-full transition-all duration-200 glow"
            style={{ left: `${peakPercentage}%` }}
          />
        )}
        
        {/* Level text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white drop-shadow-lg">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Scale markers */}
      <div className="flex justify-between text-xs text-muted-foreground font-medium">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span className="text-red-400">100%</span>
      </div>
      
      {/* Quality indicators */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="text-center glass-card p-3 rounded-xl">
          <div className="text-muted-foreground mb-1">Signal</div>
          <div className={`font-bold ${
            percentage > 10 ? 'text-green-400' : 'text-red-400'
          }`}>
            {percentage > 10 ? 'Good' : 'Low'}
          </div>
        </div>
        <div className="text-center glass-card p-3 rounded-xl">
          <div className="text-muted-foreground mb-1">Clipping</div>
          <div className={`font-bold ${
            percentage > 95 ? 'text-red-400' : 'text-green-400'
          }`}>
            {percentage > 95 ? 'Yes' : 'No'}
          </div>
        </div>
        <div className="text-center glass-card p-3 rounded-xl">
          <div className="text-muted-foreground mb-1">Dynamic</div>
          <div className={`font-bold ${
            peak - rms > 0.2 ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {peak - rms > 0.2 ? 'Good' : 'Limited'}
          </div>
        </div>
      </div>
    </div>
  )
}