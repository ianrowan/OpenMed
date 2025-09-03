'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, session, profile, loading } = useAuth()
  const [sessionDetails, setSessionDetails] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getSessionDetails = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        console.log('Debug page session check:', { data, error })
        setSessionDetails({ data, error })
      } catch (err) {
        console.error('Debug page error:', err)
        setSessionDetails({ error: err })
      }
    }

    getSessionDetails()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Auth Context State</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p><strong>Loading:</strong> {loading.toString()}</p>
            <p><strong>User:</strong> {user ? user.email : 'null'}</p>
            <p><strong>Session:</strong> {session ? 'exists' : 'null'}</p>
            <p><strong>Profile:</strong> {profile ? 'exists' : 'null'}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Direct Session Check</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(sessionDetails, null, 2)}
            </pre>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing'}</p>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
