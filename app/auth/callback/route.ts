import { createServerComponentClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  logger.debug('Auth callback initiated', { hasCode: !!code, hasError: !!error })

  if (error) {
    logger.error('Auth callback error', { error })
    return NextResponse.redirect(new URL('/auth/signin?error=' + error, requestUrl.origin))
  }

  if (code) {
    try {
      const supabase = await createServerComponentClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        logger.error('Error exchanging code for session', { error: exchangeError.message })
        return NextResponse.redirect(new URL('/auth/signin?error=callback_error', requestUrl.origin))
      }
      
      logger.info('Auth callback successful - redirecting to onboarding')
      // URL to redirect to after sign in process completes
      return NextResponse.redirect(new URL('/auth/onboarding', requestUrl.origin))
    } catch (error) {
      logger.error('Auth callback exception', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.redirect(new URL('/auth/signin?error=callback_error', requestUrl.origin))
    }
  }

  // No code provided, redirect to signin
  logger.warn('No code provided in auth callback')
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}
