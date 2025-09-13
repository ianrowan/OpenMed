import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params in Next.js 15
    const { id } = await params
    
    // Fetch messages for this conversation_id
    const { data: messages, error } = await (supabase as any)
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get conversation title from first user message
    const firstUserMessage = messages.find((msg: any) => msg.role === 'user')
    const title = firstUserMessage?.content?.substring(0, 60) + 
      (firstUserMessage?.content?.length > 60 ? '...' : '') || 'New Chat'

    const conversation = {
      id: id,
      user_id: user.id,
      title,
      messages,
      created_at: messages[0].created_at,
      updated_at: messages[messages.length - 1].created_at
    }

    return Response.json({ conversation })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return Response.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params in Next.js 15
    const { id } = await params

    // Delete all messages for this conversation
    const { error } = await (supabase as any)
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
      .eq('conversation_id', id)

    if (error) {
      throw error
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return Response.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
