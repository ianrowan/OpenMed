'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Search, BarChart3, FileText, Loader2 } from 'lucide-react'

interface AIProcessingStagesProps {
  className?: string
}

const stages = [
  { icon: Brain, label: 'Understanding your question...', duration: 2000 },
  { icon: Search, label: 'Searching medical data...', duration: 3000 },
  { icon: BarChart3, label: 'Analyzing patterns...', duration: 2500 },
  { icon: FileText, label: 'Generating response...', duration: 1500 },
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

  return (
    <Card className={cn("bg-muted/50 border-dashed", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="relative bg-primary/10 rounded-full p-2">
              <CurrentIcon className="w-4 h-4 text-primary animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">
                {stages[currentStage].label}
              </span>
              <Loader2 className="w-3 h-3 animate-spin text-primary/60" />
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-primary/10 rounded-full h-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${((currentStage + 1) / stages.length) * 100}%` 
                }}
              />
            </div>
            
            {/* Stage indicators */}
            <div className="flex gap-1">
              {stages.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors duration-300",
                    index <= currentStage ? "bg-primary" : "bg-primary/20"
                  )}
                />
              ))}
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
