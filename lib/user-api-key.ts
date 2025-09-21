import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface UserApiKeyResult {
  hasCustomKey: boolean
  apiKey?: string
  error?: string
}

export async function getUserOpenAIKey(): Promise<UserApiKeyResult> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { 
        hasCustomKey: false, 
        error: 'User not authenticated' 
      }
    }

    // Check if user has a custom API key
    const { data: keyData, error: keyError } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (keyError && keyError.code !== 'PGRST116') {
      console.error('Error checking for user API key:', keyError)
      return { 
        hasCustomKey: false, 
        error: 'Failed to check for custom API key' 
      }
    }

    // If no custom key, return false
    if (!keyData) {
      return { hasCustomKey: false }
    }

    // Get the decrypted API key using the RPC function
    const { data: decryptedKey, error: decryptError } = await supabase
      .rpc('get_user_api_key', { p_user_id: user.id })

    if (decryptError) {
      console.error('Error decrypting user API key:', decryptError)
      return { 
        hasCustomKey: false, 
        error: 'Failed to decrypt API key' 
      }
    }

    return { 
      hasCustomKey: true, 
      apiKey: decryptedKey 
    }
  } catch (error) {
    console.error('Error getting user OpenAI key:', error)
    return { 
      hasCustomKey: false, 
      error: 'Unexpected error occurred' 
    }
  }
}

// Helper function to update last_used_at timestamp
export async function updateApiKeyLastUsed(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return
    }

    // Update the last_used_at timestamp
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)
  } catch (error) {
    console.error('Error updating API key last used timestamp:', error)
    // Don't throw here - this is just for tracking
  }
}
