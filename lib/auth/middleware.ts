import { type NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerSupabaseClient(request, response)

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/profile', '/upload', '/chat']
  const authPaths = ['/auth/signin', '/auth/signup', '/auth/onboarding']
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If user is not logged in and trying to access protected route
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // If user is logged in and trying to access auth pages
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export { updateSession as middleware }
