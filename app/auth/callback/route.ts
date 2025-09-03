import { createServerComponentClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('Auth callback - code:', !!code, 'error:', error)

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=' + error, requestUrl.origin))
  }

  if (code) {
    try {
      const supabase = await createServerComponentClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(new URL('/auth/signin?error=callback_error', requestUrl.origin))
      }
      
      console.log('Auth callback successful - redirecting to onboarding')
      // URL to redirect to after sign in process completes
      return NextResponse.redirect(new URL('/auth/onboarding', requestUrl.origin))
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=callback_error', requestUrl.origin))
    }
  }

  // No code provided, redirect to signin
  console.log('No code provided in auth callback')
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}
