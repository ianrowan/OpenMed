'use client'

import { AlertTriangle, Clock, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UsageLimitErrorProps {
  modelTier: 'premium' | 'basic'
  resetTime: Date
  className?: string
}

export function UsageLimitError({ modelTier, resetTime, className }: UsageLimitErrorProps) {
  const getResetTimeString = () => {
    const hoursUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60 * 60))
    if (hoursUntilReset <= 1) {
      const minutesUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60))
      return `${minutesUntilReset} minute${minutesUntilReset === 1 ? '' : 's'}`
    }
    return `${hoursUntilReset} hour${hoursUntilReset === 1 ? '' : 's'}`
  }

  const getTierInfo = () => {
    switch (modelTier) {
      case 'premium':
        return {
          icon: <Zap className="w-4 h-4" />,
          name: 'Premium',
          description: 'GPT-5 and GPT-4.1 models'
        }
      case 'basic':
        return {
          icon: <Clock className="w-4 h-4" />,
          name: 'Basic',
          description: 'GPT-5-Mini and GPT-4.1-Mini models'
        }
    }
  }

  const tierInfo = getTierInfo()

  return (
    <Alert className={`border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="flex items-center gap-2 mb-2">
          {tierInfo.icon}
          <span className="font-medium">{tierInfo.name} model usage limit reached</span>
        </div>
        <p className="text-sm mb-1">
          You've reached your daily limit for {tierInfo.description.toLowerCase()}. 
        </p>
        <p className="text-sm">
          Your usage will reset in <span className="font-medium">{getResetTimeString()}</span>.
        </p>
      </AlertDescription>
    </Alert>
  )
}
