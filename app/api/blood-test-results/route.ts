import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
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

    // Fetch blood test results for the user
    const { data: bloodTests, error } = await supabase
      .from('blood_test_results')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false })

    if (error) {
      console.error('Error fetching blood test results:', error)
      return Response.json(
        { error: 'Failed to fetch blood test results' },
        { status: 500 }
      )
    }

    return Response.json({ bloodTests })
  } catch (error) {
    console.error('Error in blood test results API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
