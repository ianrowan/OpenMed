import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getUserUsageStats } from '@/lib/usage-limits'

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

    // Get usage statistics for the user
    const stats = await getUserUsageStats(supabase, user.id)

    return Response.json(stats)
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return Response.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    )
  }
}
