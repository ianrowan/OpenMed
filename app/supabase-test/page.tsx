// Test page to verify Supabase connection
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<{
    url?: string
    key?: string
    connected?: boolean
    error?: string
  }>({})

  useEffect(() => {
    try {
      // Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('Supabase URL:', url)
      console.log('Supabase Key:', key ? `${key.substring(0, 20)}...` : 'undefined')
      
      setStatus({
        url: url || 'undefined',
        key: key ? `${key.substring(0, 20)}...` : 'undefined',
      })

      if (url && key) {
        // Try to create client
        const supabase = createClient()
        console.log('Supabase client created:', supabase)
        
        // Test connection
        supabase.auth.getSession().then((result) => {
          console.log('Auth session result:', result)
          setStatus(prev => ({
            ...prev,
            connected: true
          }))
        }).catch((error) => {
          console.error('Supabase connection error:', error)
          setStatus(prev => ({
            ...prev,
            connected: false,
            error: error.message
          }))
        })
      }
    } catch (error: any) {
      console.error('Supabase setup error:', error)
      setStatus(prev => ({
        ...prev,
        connected: false,
        error: error.message
      }))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
            <div className="space-y-2 font-mono text-sm">
              <div>URL: <span className="text-blue-600">{status.url}</span></div>
              <div>Key: <span className="text-blue-600">{status.key}</span></div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
            <div className="space-y-2">
              {status.connected === undefined && (
                <div className="text-yellow-600">Testing connection...</div>
              )}
              {status.connected === true && (
                <div className="text-green-600">✅ Connected successfully!</div>
              )}
              {status.connected === false && (
                <div className="text-red-600">❌ Connection failed</div>
              )}
              {status.error && (
                <div className="text-red-600 bg-red-50 p-3 rounded">
                  Error: {status.error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
