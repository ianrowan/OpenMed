'use client'

import { cn } from '@/lib/utils'
import { Loader2, Brain, Activity } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'medical'
}

export function LoadingSpinner({ 
  className, 
  size = 'md',
  variant = 'default'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  if (variant === 'medical') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative">
          <Activity className={cn(
            "animate-pulse text-primary",
            sizeClasses[size]
          )} />
          <div className="absolute inset-0">
            <Loader2 className={cn(
              "animate-spin text-primary/50",
              sizeClasses[size]
            )} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-muted-foreground">Analyzing...</span>
        </div>
      </div>
    )
  }

  return (
    <Loader2 className={cn(
      "animate-spin text-primary",
      sizeClasses[size],
      className
    )} />
  )
}

interface ThinkingAnimationProps {
  className?: string
}

export function ThinkingAnimation({ className }: ThinkingAnimationProps) {
  return (
    <div className={cn("flex items-center gap-3 p-4", className)}>
      <div className="relative">
        <Brain className="w-6 h-6 text-primary animate-pulse" />
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-primary/30 rounded-full animate-ping"></div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
        <div className="space-y-1">
          <div className="h-2 bg-primary/20 rounded animate-pulse w-24"></div>
          <div className="h-2 bg-primary/10 rounded animate-pulse w-16"></div>
        </div>
        <span className="text-xs text-muted-foreground">AI is thinking...</span>
      </div>
    </div>
  )
}
