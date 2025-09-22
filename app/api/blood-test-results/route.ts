import { createServerComponentClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const demo = searchParams.get('demo') === 'true'

    const supabase = await createServerComponentClient()

    if (demo) {
      // Demo mode - query demo table without authentication
      const { data, error } = await supabase
        .from('demo_blood_test_results')
        .select('*')
        .order('test_date', { ascending: false })

      if (error) {
        logger.error('Demo blood test results error', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json(
          { error: 'Failed to fetch demo blood test results' },
          { status: 500 }
        )
      }

      return NextResponse.json({ data: data || [] })
    }

    // Regular mode - require authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('blood_test_results')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false })

    if (error) {
      logger.error('Blood test results error', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json(
        { error: 'Failed to fetch blood test results' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    logger.error('Unexpected error in blood test results API', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
