'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AVAILABLE_MODELS, ModelType } from '@/lib/ai'
import { useUsageLimits } from '@/hooks/use-usage-limits'
import { Settings, Zap, Clock, AlertTriangle, Cpu, Info } from 'lucide-react'

interface ModelSelectorProps {
  selectedModel: ModelType
  onModelChange: (model: ModelType) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const { usageStats, loading, error } = useUsageLimits()

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Zap className="w-3 h-3" />
      case 'standard':
        return <Cpu className="w-3 h-3" />
      case 'basic':
        return <Clock className="w-3 h-3" />
      default:
        return null
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
      case 'standard':
        return 'bg-blue-500 text-white'
      case 'basic':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getUsageInfo = (tier: 'premium' | 'basic') => {
    if (!usageStats) return null
    
    const tierStats = usageStats[tier]
    const usage = tierStats.current
    const limit = tierStats.limit
    const percentage = limit > 0 ? (usage / limit) * 100 : 0
    
    return {
      usage,
      limit,
      percentage,
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100
    }
  }

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel)
  const currentTier = currentModel?.tier as 'premium' | 'basic' || 'basic'
  const usageInfo = getUsageInfo(currentTier)

  return (
    <div className="flex items-center gap-2">
      <Settings className="w-4 h-4 text-muted-foreground" />
      <Select
        value={selectedModel}
        onValueChange={(value) => onModelChange(value as ModelType)}
        disabled={disabled}
      >
        <SelectTrigger className="w-48 h-8 text-xs">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{currentModel?.name || selectedModel}</span>
              <Badge 
                className={`text-xs px-1 py-0 ${getTierColor(currentModel?.tier || 'basic')}`}
              >
                {getTierIcon(currentModel?.tier || 'basic')}
              </Badge>
              {usageInfo?.isNearLimit && (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.map((model) => {
            const modelTier = model.tier as 'premium' | 'basic'
            const modelUsageInfo = getUsageInfo(modelTier)
            
            return (
              <SelectItem 
                key={model.id} 
                value={model.id}
                className="py-3"
                disabled={modelUsageInfo?.isAtLimit}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <Badge 
                      className={`text-xs px-1 py-0 ${getTierColor(model.tier)}`}
                    >
                      {getTierIcon(model.tier)}
                    </Badge>
                    {modelUsageInfo?.isNearLimit && (
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {model.description}
                </div>
                {modelUsageInfo && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Daily Usage</span>
                      <span className={modelUsageInfo.isNearLimit ? 'text-yellow-600' : 'text-muted-foreground'}>
                        {modelUsageInfo.usage}/{modelUsageInfo.limit}
                      </span>
                    </div>
                    <Progress 
                      value={modelUsageInfo.percentage} 
                      className="h-1"
                    />
                  </div>
                )}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      
      {/* Usage stats display */}
      {usageStats && usageInfo && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="w-3 h-3" />
          <span className={usageInfo.isNearLimit ? 'text-yellow-600' : ''}>
            {usageInfo.usage}/{usageInfo.limit}
          </span>
        </div>
      )}
    </div>
  )
}
