import { createServerClient } from '@supabase/ssr'

// Model tier definitions matching the AI models
export type ModelTier = 'premium' | 'basic'

export const MODEL_TIERS: Record<string, ModelTier> = {
  'gpt-5': 'premium',
  'gpt-4.1': 'premium',
  'gpt-5-mini': 'basic',
  'gpt-4.1-mini': 'basic',
}

// Get limits from environment variables with defaults
export const USAGE_LIMITS = {
  premium: parseInt(process.env.DAILY_PREMIUM_LIMIT || '10'), // Default 10 premium messages per day
  basic: parseInt(process.env.DAILY_BASIC_LIMIT || '50'),     // Default 50 basic messages per day
}

export interface UsageRecord {
  id: string
  user_id: string
  model_tier: ModelTier
  model_name: string
  message_count: number
  date: string
  created_at: string
  updated_at: string
}

export interface UsageCheckResult {
  allowed: boolean
  currentUsage: number
  limit: number
  resetTime: Date
  error?: string
}

/**
 * Check if user has exceeded their daily message limit for a specific model tier
 */
export async function checkUsageLimit(
  supabase: any,
  userId: string,
  modelName: string
): Promise<UsageCheckResult> {
  try {
    const modelTier = MODEL_TIERS[modelName]
    if (!modelTier) {
      return {
        allowed: false,
        currentUsage: 0,
        limit: 0,
        resetTime: new Date(),
        error: `Unknown model: ${modelName}`
      }
    }

    const limit = USAGE_LIMITS[modelTier]
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Get today's usage for this model tier
    const { data, error } = await supabase
      .from('daily_usage_limits')
      .select('message_count')
      .eq('user_id', userId)
      .eq('model_tier', modelTier)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking usage limit:', error)
      return {
        allowed: false,
        currentUsage: 0,
        limit,
        resetTime: getNextResetTime(),
        error: 'Failed to check usage limits'
      }
    }

    const currentUsage = data?.message_count || 0
    const allowed = currentUsage < limit

    return {
      allowed,
      currentUsage,
      limit,
      resetTime: getNextResetTime(),
    }
  } catch (error) {
    console.error('Error in checkUsageLimit:', error)
    return {
      allowed: false,
      currentUsage: 0,
      limit: USAGE_LIMITS[MODEL_TIERS[modelName]] || 0,
      resetTime: getNextResetTime(),
      error: 'Internal error checking usage limits'
    }
  }
}

/**
 * Increment the usage count for a user's model tier
 */
export async function incrementUsage(
  supabase: any,
  userId: string,
  modelName: string
): Promise<boolean> {
  try {
    const modelTier = MODEL_TIERS[modelName]
    if (!modelTier) {
      console.error(`Unknown model tier for model: ${modelName}`)
      return false
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Use upsert to either create or increment the usage record
    const { error } = await supabase
      .from('daily_usage_limits')
      .upsert({
        user_id: userId,
        model_tier: modelTier,
        model_name: modelName,
        date: today,
        message_count: 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,model_tier,date',
        ignoreDuplicates: false
      })

    if (error) {
      // If upsert failed, try to increment existing record
      const { error: incrementError } = await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_model_tier: modelTier,
        p_model_name: modelName,
        p_date: today
      })

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in incrementUsage:', error)
    return false
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(
  supabase: any,
  userId: string
): Promise<{
  premium: { current: number; limit: number; resetTime: Date }
  basic: { current: number; limit: number; resetTime: Date }
}> {
  const today = new Date().toISOString().split('T')[0]
  const resetTime = getNextResetTime()

  try {
    const { data, error } = await supabase
      .from('daily_usage_limits')
      .select('model_tier, message_count')
      .eq('user_id', userId)
      .eq('date', today)

    if (error) {
      console.error('Error fetching usage stats:', error)
    }

    const usageMap = new Map<ModelTier, number>()
    if (data) {
      for (const record of data) {
        usageMap.set(record.model_tier, record.message_count)
      }
    }

    return {
      premium: {
        current: usageMap.get('premium') || 0,
        limit: USAGE_LIMITS.premium,
        resetTime
      },
      basic: {
        current: usageMap.get('basic') || 0,
        limit: USAGE_LIMITS.basic,
        resetTime
      }
    }
  } catch (error) {
    console.error('Error in getUserUsageStats:', error)
    return {
      premium: { current: 0, limit: USAGE_LIMITS.premium, resetTime },
      basic: { current: 0, limit: USAGE_LIMITS.basic, resetTime }
    }
  }
}

/**
 * Get the next reset time (midnight in user's timezone, defaulting to UTC)
 */
function getNextResetTime(): Date {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(now.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0) // Set to midnight UTC
  return tomorrow
}

/**
 * Format usage limit error message
 */
export function formatUsageLimitError(
  modelTier: ModelTier,
  currentUsage: number,
  limit: number,
  resetTime: Date
): string {
  const tierName = modelTier === 'premium' ? 'Premium' : 'Basic'
  const resetTimeStr = resetTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZoneName: 'short'
  })
  
  return `You've reached your daily limit of ${limit} ${tierName} model messages (${currentUsage}/${limit}). Your limit will reset tomorrow at ${resetTimeStr}.`
}
