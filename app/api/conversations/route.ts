import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

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

    // Get distinct conversation IDs and their metadata
    const { data: conversationData, error } = await (supabase as any)
      .from('chat_messages')
      .select('conversation_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Group by conversation_id and get the first message of each conversation for title
    const conversationMap = new Map()
    
    for (const row of conversationData || []) {
      if (!conversationMap.has(row.conversation_id)) {
        conversationMap.set(row.conversation_id, {
          id: row.conversation_id,
          created_at: row.created_at,
          updated_at: row.created_at
        })
      } else {
        // Update the updated_at time if this message is more recent
        const existing = conversationMap.get(row.conversation_id)
        if (new Date(row.created_at) > new Date(existing.updated_at)) {
          existing.updated_at = row.created_at
        }
        if (new Date(row.created_at) < new Date(existing.created_at)) {
          existing.created_at = row.created_at
        }
      }
    }

    // Get titles for each conversation (first user message)
    const conversations = []
    for (const [conversationId, conv] of conversationMap.entries()) {
      // Get the first user message for the title
      const { data: firstMessage, error: titleError } = await (supabase as any)
        .from('chat_messages')
        .select('content')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .eq('role', 'user')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      const title = firstMessage?.content?.substring(0, 60) + 
        (firstMessage?.content?.length > 60 ? '...' : '') || 'New Chat'

      conversations.push({
        ...conv,
        user_id: user.id,
        title
      })
    }

    // Sort by updated_at descending (most recent first)
    conversations.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    return Response.json({ conversations })
  } catch (error) {
    logger.error('Error fetching conversations', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    return Response.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { title } = await request.json()
    
    // Generate a unique conversation ID
    const conversationId = crypto.randomUUID()
    
    const conversation = {
      id: conversationId,
      title: title || 'New Chat',
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return Response.json({ conversation })
  } catch (error) {
    logger.error('Error creating conversation', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
