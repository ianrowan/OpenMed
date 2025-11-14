'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AIProcessingStagesProps {
  className?: string
}

export function AIProcessingStages({ className }: AIProcessingStagesProps) {
  const [dots, setDots] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev % 3) + 1)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-500",
      "animate-in fade-in duration-200",
      className
    )}>
      {/* Simple pulsing dots - ChatGPT style */}
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full bg-slate-400 transition-opacity duration-300",
              i <= dots ? "opacity-100" : "opacity-30"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-slate-400">Thinking...</span>
    </div>
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
