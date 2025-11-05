'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Search, BarChart3, FileText, Sparkles } from 'lucide-react'

interface AIProcessingStagesProps {
  className?: string
}

const stages = [
  { icon: Brain, label: 'Understanding your question...', duration: 2000, color: 'from-blue-500 to-cyan-500' },
  { icon: Search, label: 'Searching medical data...', duration: 3000, color: 'from-violet-500 to-purple-500' },
  { icon: BarChart3, label: 'Analyzing patterns...', duration: 2500, color: 'from-indigo-500 to-blue-500' },
  { icon: FileText, label: 'Generating response...', duration: 1500, color: 'from-blue-600 to-indigo-600' },
]

export function AIProcessingStages({ className }: AIProcessingStagesProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [showStages, setShowStages] = useState(true)

  useEffect(() => {
    if (!showStages) return

    const timer = setTimeout(() => {
      if (currentStage < stages.length - 1) {
        setCurrentStage(current => current + 1)
      }
      // Stop at the final stage instead of looping
    }, stages[currentStage].duration)

    return () => clearTimeout(timer)
  }, [currentStage, showStages])

  const CurrentIcon = stages[currentStage].icon
  const currentColor = stages[currentStage].color

  return (
    <Card className={cn(
      "relative overflow-hidden border-none shadow-lg",
      "bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50",
      "backdrop-blur-sm",
      className
    )}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 animate-pulse" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
      </div>

      <CardContent className="relative p-4">
        <div className="flex items-center gap-4">
          {/* Animated icon container */}
          <div className="relative flex-shrink-0">
            {/* Outer pulse ring */}
            <div className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-20",
              "bg-gradient-to-br",
              currentColor
            )} />
            
            {/* Middle glow ring */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-md opacity-40 animate-pulse",
              "bg-gradient-to-br",
              currentColor
            )} />
            
            {/* Icon container */}
            <div className={cn(
              "relative rounded-full p-3 shadow-lg",
              "bg-gradient-to-br",
              currentColor
            )}>
              <CurrentIcon className="w-5 h-5 text-white animate-pulse" />
            </div>
            
            {/* Sparkles */}
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
          
          <div className="flex-1 space-y-3 min-w-0">
            {/* Stage label with gradient text */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-semibold bg-gradient-to-r bg-clip-text text-transparent",
                currentColor
              )}>
                {stages[currentStage].label}
              </span>
            </div>
            
            {/* Enhanced progress bar with gradient */}
            <div className="relative w-full h-2 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
              {/* Animated background shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
              
              {/* Progress fill with gradient */}
              <div 
                className={cn(
                  "relative h-full rounded-full transition-all duration-700 ease-out shadow-md",
                  "bg-gradient-to-r",
                  currentColor
                )}
                style={{ 
                  width: `${((currentStage + 1) / stages.length) * 100}%` 
                }}
              >
                {/* Inner shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1s_infinite]" />
              </div>
            </div>
            
            {/* Stage indicators with enhanced design */}
            <div className="flex items-center gap-2">
              {stages.map((stage, index) => {
                const StageIcon = stage.icon
                const isActive = index === currentStage
                const isCompleted = index < currentStage
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "relative flex items-center justify-center transition-all duration-500",
                      isActive && "scale-110"
                    )}
                  >
                    {/* Indicator dot/icon */}
                    {isActive ? (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        "bg-gradient-to-br shadow-md",
                        stage.color
                      )}>
                        <StageIcon className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className={cn(
                        "w-3 h-3 rounded-full transition-all duration-300",
                        isCompleted 
                          ? "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm" 
                          : "bg-slate-300/50"
                      )} />
                    )}
                    
                    {/* Connecting line */}
                    {index < stages.length - 1 && (
                      <div className={cn(
                        "w-3 h-0.5 transition-all duration-500",
                        isCompleted 
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500" 
                          : "bg-slate-300/50"
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickLoadingProps {
  className?: string
}

export function QuickLoading({ className }: QuickLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2 p-2", className)}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      </div>
      <span className="text-sm text-muted-foreground">AI is thinking...</span>
    </div>
  )
}
