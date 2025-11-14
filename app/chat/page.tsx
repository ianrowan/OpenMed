'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { ChatInterfaceWithHistory } from '@/components/chat/chat-interface-with-history'
import { ChatProvider } from '@/components/chat/chat-context'
import { ConsentDialog, useConsent } from '@/components/ConsentDialog'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Activity } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  const { user, loading } = useAuth()
  const { hasConsented, giveConsent } = useConsent('chat-consent')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 max-w-md">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Authentication Required</h1>
          <p className="text-slate-600 mb-6">Please sign in to access the chat feature.</p>
          <Link href="/auth/signin">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show consent dialog if user hasn't consented
  if (hasConsented === false) {
    return (
      <>
        <ConsentDialog
          open={true}
          onAccept={giveConsent}
          storageKey="chat-consent"
          title="Medical AI Chat - Terms & Privacy"
          description="Before using our AI chat feature, please review and accept our terms"
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 max-w-md">
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Welcome to OpenMed Chat</h1>
            <p className="text-slate-600">Please accept the terms to continue</p>
          </div>
        </div>
      </>
    )
  }

  // Loading consent state
  if (hasConsented === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <ChatProvider>
      <div className="h-screen max-w-full bg-white">
        <ChatInterfaceWithHistory />
      </div>
    </ChatProvider>
  )
}
