'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AVAILABLE_MODELS, ModelType } from '@/lib/ai'
import { Settings, Zap, Cpu, Clock } from 'lucide-react'

interface ModelSelectorProps {
  selectedModel: ModelType
  onModelChange: (model: ModelType) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
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

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel)

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
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem 
              key={model.id} 
              value={model.id}
              className="py-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.name}</span>
                  <Badge 
                    className={`text-xs px-1 py-0 ${getTierColor(model.tier)}`}
                  >
                    {getTierIcon(model.tier)}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {model.description}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
