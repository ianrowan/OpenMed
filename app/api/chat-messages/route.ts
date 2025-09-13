import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
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

    const { conversation_id, role, content, tool_calls } = await req.json()

    if (!conversation_id || !role || !content) {
      return Response.json({ error: 'conversation_id, role and content are required' }, { status: 400 })
    }

    // Insert the message with conversation_id
    const { data: message, error } = await (supabase as any)
      .from('chat_messages')
      .insert({
        user_id: user.id,
        conversation_id,
        role,
        content,
        tool_calls: tool_calls || null
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return Response.json({ message })
  } catch (error) {
    console.error('Error saving chat message:', error)
    return Response.json(
      { error: 'Failed to save chat message' },
      { status: 500 }
    )
  }
}
