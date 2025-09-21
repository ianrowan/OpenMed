import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's API key info (without exposing the actual key)
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, key_name, is_active, last_used_at, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching API key:', error)
      return Response.json({ error: 'Failed to fetch API key' }, { status: 500 })
    }

    return Response.json({
      hasKey: !!data,
      keyInfo: data || null
    })
  } catch (error) {
    console.error('API key fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch API key information' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, keyName } = await request.json()

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return Response.json(
        { error: 'Please provide a valid OpenAI API key' },
        { status: 400 }
      )
    }

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
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Encrypt the API key
    const { data: encryptedKey, error: encryptError } = await supabase
      .rpc('encrypt_api_key', { api_key: apiKey })

    if (encryptError) {
      console.error('Error encrypting API key:', encryptError)
      return Response.json({ error: 'Failed to encrypt API key' }, { status: 500 })
    }

    // Store the encrypted API key (upsert to handle updates)
    const { error: insertError } = await supabase
      .from('user_api_keys')
      .upsert({
        user_id: user.id,
        encrypted_api_key: encryptedKey,
        key_name: keyName || 'OpenAI API Key',
        is_active: true
      })

    if (insertError) {
      console.error('Error storing API key:', insertError)
      return Response.json({ error: 'Failed to store API key' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'API key saved successfully' 
    })
  } catch (error) {
    console.error('API key save error:', error)
    return Response.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
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
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user's API key
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting API key:', error)
      return Response.json({ error: 'Failed to delete API key' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'API key deleted successfully' 
    })
  } catch (error) {
    console.error('API key delete error:', error)
    return Response.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}
