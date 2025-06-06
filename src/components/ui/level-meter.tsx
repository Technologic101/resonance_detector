"use client"

interface LevelMeterProps {
  level: number
  peak?: number
  className?: string
}

export function LevelMeter({ level, peak = 0, className = '' }: LevelMeterProps) {
  const percentage = Math.min(level * 100, 100)
  const peakPercentage = Math.min(peak * 100, 100)

  const getColorClass = (value: number) => {
    if (value > 90) return 'bg-red-500'
    if (value > 75) return 'bg-yellow-500'
    if (value > 50) return 'bg-green-500'
    return 'bg-blue-500'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Input Level</span>
        <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
      </div>
      
      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* Background segments */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className={`flex-1 mx-px ${
                i < 10 ? 'bg-green-200 dark:bg-green-800' :
                i < 15 ? 'bg-yellow-200 dark:bg-yellow-800' :
                'bg-red-200 dark:bg-red-800'
              }`}
            />
          ))}
        </div>
        
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
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}