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
      <div className="h-screen max-w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex h-full flex-col">
          <header className="border-b border-slate-200 px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-white/80 backdrop-blur-md flex-shrink-0 shadow-sm sticky top-0 z-10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                <Activity className="h-6 w-6 md:h-7 md:w-7 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    OpenMed
                  </h1>
                  <p className="text-xs text-slate-600 font-medium hidden sm:block">
                    AI-powered medical assistant
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600 transition-all text-xs md:text-sm px-2 md:px-3">
                  <LayoutDashboard className="h-4 w-4 md:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
            </div>
          </header>
          <main className="flex-1 min-h-0">
            <ChatInterfaceWithHistory />
          </main>
        </div>
      </div>
    </ChatProvider>
  )
}
