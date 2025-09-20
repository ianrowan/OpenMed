'use client'

import { useEffect, useState, useCallback } from 'react'

interface UsageStats {
  premium: {
    current: number
    limit: number
    resetTime: Date
  }
  basic: {
    current: number
    limit: number
    resetTime: Date
  }
}

export function useUsageLimits() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsageStats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usage-stats')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch usage stats: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Convert resetTime strings back to Date objects
      const stats: UsageStats = {
        premium: {
          ...data.premium,
          resetTime: new Date(data.premium.resetTime)
        },
        basic: {
          ...data.basic,
          resetTime: new Date(data.basic.resetTime)
        }
      }
      
      setUsageStats(stats)
      setError(null)
    } catch (err) {
      console.error('Error fetching usage stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsageStats()
  }, [fetchUsageStats])

  const getUsageForModel = useCallback((modelName: string) => {
    if (!usageStats) return null

    // Map model names to tiers
    const modelTiers: Record<string, 'premium' | 'basic'> = {
      'gpt-5': 'premium',
      'gpt-4.1': 'premium', 
      'gpt-5-mini': 'basic',
      'gpt-4.1-mini': 'basic'
    }

    const tier = modelTiers[modelName]
    if (!tier) return null

    return usageStats[tier]
  }, [usageStats])

  const canUseModel = useCallback((modelName: string): boolean => {
    const usage = getUsageForModel(modelName)
    if (!usage) return true // Allow if we can't determine usage
    
    return usage.current < usage.limit
  }, [getUsageForModel])

  const getUsagePercentage = useCallback((modelName: string): number => {
    const usage = getUsageForModel(modelName)
    if (!usage || usage.limit === 0) return 0
    
    return Math.round((usage.current / usage.limit) * 100)
  }, [getUsageForModel])

  return {
    usageStats,
    loading,
    error,
    refetch: fetchUsageStats,
    getUsageForModel,
    canUseModel,
    getUsagePercentage
  }
}
