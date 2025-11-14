'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatMessage } from '@/components/chat/chat-message'
import { ToolCallVisualization } from '@/components/chat/tool-call-visualization'
import { ModelSelector } from '@/components/chat/model-selector'
import { AIProcessingStages } from '@/components/ui/ai-processing'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { UsageLimitError } from '@/components/chat/usage-limit-error'
import { CustomKeyBanner } from '@/components/chat/custom-key-indicator'
import { useChatContext } from '@/components/chat/chat-context'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { BloodworkDialog } from '@/components/dialogs/bloodwork-dialog'
import { Send, Upload, Activity, Menu, X, TestTube, LayoutDashboard } from 'lucide-react'
import { ModelType } from '@/lib/ai'
import { cn } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'
import type { Message as UIMessage } from 'ai'
import Link from 'next/link'

// Utility functions to convert between UI messages and ChatMessage types
const convertUIMessageToChatMessage = (uiMessage: UIMessage): any => ({
  id: uiMessage.id,
  role: uiMessage.role,
  content: uiMessage.content,
  tool_calls: uiMessage.toolInvocations,
  created_at: new Date().toISOString()
})

const convertChatMessageToUIMessage = (chatMessage: any): UIMessage => ({
  id: chatMessage.id,
  role: chatMessage.role,
  content: chatMessage.content,
  toolInvocations: chatMessage.tool_calls
})

export function ChatInterfaceWithHistory() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('gpt-4.1-mini')
  // Default sidebar state based on screen size
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 // Open on desktop (md breakpoint), closed on mobile
    }
    return true // Default to open for SSR
  })
  const [demoMode, setDemoMode] = useState(false)
  const [chatError, setChatError] = useState<{
    message: string
    type?: string
    details?: any
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Wrapper function to track model changes
  const handleModelChange = (newModel: ModelType) => {
    Analytics.modelChanged(selectedModel, newModel)
    setSelectedModel(newModel)
  }
  
  const {
    currentConversation,
    conversations,
    loading: conversationsLoading,
    createNewConversation,
    loadConversation,
    deleteConversation,
    refreshConversations
  } = useChatContext()

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    id: currentConversation?.id || 'default', // Use conversation ID as the chat ID
    body: {
      model: selectedModel,
      conversation_id: currentConversation?.id,
      demo_mode: demoMode
    },
    onError: (error) => {
      console.error('Chat error:', error)
      
      // Clear any previous error
      setChatError(null)
      
      // Try to parse the error response for usage limit errors
      try {
        if (error.message) {
          // Try to parse JSON error response
          const errorData = JSON.parse(error.message)
          if (errorData.type === 'USAGE_LIMIT_EXCEEDED') {
            setChatError({
              message: errorData.error,
              type: 'USAGE_LIMIT_EXCEEDED',
              details: {
                currentUsage: errorData.currentUsage,
                limit: errorData.limit,
                resetTime: new Date(errorData.resetTime),
                modelTier: errorData.modelTier
              }
            })
            return
          }
        }
      } catch (parseError) {
        // If parsing fails, fall back to generic error
      }
      
      // Generic error handling
      setChatError({
        message: error.message || 'An error occurred while processing your request',
        type: 'GENERIC_ERROR'
      })
    },
    onFinish: async (message) => {
      // Refresh conversations to show updated sidebar
      await refreshConversations()
      // Reload the current conversation to get the saved messages
      if (currentConversation?.id) {
        setTimeout(async () => {
          await loadConversation(currentConversation.id)
        }, 500)
      }
    }
  })

  // Auto-scroll to bottom when messages change or when loading
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Load conversation messages when current conversation changes
  useEffect(() => {
    if (currentConversation?.messages) {
      const uiMessages = currentConversation.messages.map(convertChatMessageToUIMessage)
      setMessages(uiMessages)
    } else {
      setMessages([])
    }
  }, [currentConversation?.id, setMessages]) // Add setMessages to deps

  // Remove auto-save on every message change to prevent infinite loops and excessive API calls
  // Only save on specific events like onFinish or manual saves

  const handleNewChat = async () => {
    await createNewConversation()
    setMessages([])
    // Close sidebar on mobile after creating new chat
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleConversationSelect = async (conversationId: string) => {
    await loadConversation(conversationId)
    // Close sidebar on mobile after selecting conversation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Clear any existing errors when submitting new message
    setChatError(null)
    
    // Track chat message analytics
    Analytics.chatMessage(selectedModel)
    
    // Submit the message immediately - the API will create the conversation if needed
    handleSubmit(e)
    
    // If no current conversation, refresh after a short delay to pick up the new one
    if (!currentConversation) {
      setTimeout(() => {
        refreshConversations()
      }, 1000)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-full max-h-full">
      {/* Sidebar - Overlay on mobile, sidebar on desktop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r bg-background",
        "fixed md:relative inset-y-0 left-0 z-30 md:z-0",
        sidebarOpen ? "w-72 md:w-80" : "w-0 -translate-x-full md:translate-x-0 border-r-0"
      )}>
        <div className={cn(
          "h-full overflow-hidden",
          sidebarOpen ? "block" : "hidden"
        )}>
          <ChatSidebar
            currentConversationId={currentConversation?.id}
            onConversationSelect={handleConversationSelect}
            onNewChat={handleNewChat}
            onDeleteConversation={deleteConversation}
            onRefresh={refreshConversations}
            conversations={conversations}
            loading={conversationsLoading}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full md:w-auto">
        {!hasMessages ? (
          <div className="flex h-full flex-col">
            {/* Compact header with logo */}
            <div className="border-b border-slate-200 px-3 py-2 md:px-4 md:py-2.5 bg-white/80 backdrop-blur-md flex-shrink-0 shadow-sm sticky top-0 z-10">
              <div className="flex items-center justify-between gap-2 md:gap-4">
                {/* Left side: Menu + Logo */}
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hover:bg-blue-50 flex-shrink-0 h-8 w-8 p-0"
                  >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </Button>
                  
                  {/* Logo + Brand */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <span className="hidden sm:inline text-sm md:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      OpenMed
                    </span>
                  </div>
                </div>
                
                {/* Right side: Dashboard + Demo + Model */}
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1.5 hover:bg-blue-50 hover:text-blue-600 transition-all h-8 px-2 md:px-3">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden lg:inline font-medium text-xs">Dashboard</span>
                    </Button>
                  </Link>
                  
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-lg border border-orange-200">
                    <TestTube className="w-3.5 h-3.5 text-orange-600" />
                    <Label htmlFor="demo-mode" className="text-xs font-medium text-slate-700 hidden sm:inline">Demo</Label>
                    <Switch 
                      id="demo-mode"
                      checked={demoMode} 
                      onCheckedChange={setDemoMode}
                      className="data-[state=checked]:bg-orange-500 scale-75"
                    />
                  </div>
                  
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={handleModelChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Custom API Key Banner */}
            <CustomKeyBanner />

            {/* Welcome content area */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 min-h-0 bg-white overflow-y-auto">
              <div className="text-center space-y-3 sm:space-y-4 max-w-2xl px-2">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                  <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Welcome to OpenMed AI</h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto font-medium">
                  {demoMode ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-lg text-xs sm:text-sm font-semibold mb-3 shadow-sm border border-orange-200">
                        <TestTube className="w-3 h-3 sm:w-4 sm:h-4" />
                        Demo Mode Active
                      </span>
                      <br />
                      You're chatting with sample medical data. Toggle off Demo Mode to use your own data.
                    </>
                  ) : (
                    <>
                      Upload your medical data and start chatting to gain insights about your health.
                      I can analyze blood work, genetic data, and search medical literature.
                    </>
                  )}
                </p>
              </div>

              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 max-w-2xl w-full px-2">
                <Link href="/upload" className="group">
                  <Card className="cursor-pointer border-2 hover:border-blue-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm h-full hover:scale-105 transform duration-200">
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 group-hover:text-blue-700" />
                        Upload Data
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-slate-600 font-medium">
                        Upload blood work, genetic test results, or other medical data
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Card className="cursor-pointer border-2 hover:border-purple-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm h-full hover:scale-105 transform duration-200">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Example Questions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-600 font-medium">
                      Try asking about biomarker trends, genetic variants, or health correlations
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="mt-2 sm:mt-4 px-2 w-full max-w-2xl flex justify-center">
                <BloodworkDialog triggerText="Need Bloodwork? Get comprehensive testing" triggerSize="default" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow" />
              </div>
            </div>

            {/* Floating chat input area at bottom */}
            <div className="bg-white p-3 sm:p-4 md:p-6 flex-shrink-0">
              {/* Error display */}
              {chatError && (
                <div className="mb-3 space-y-2 w-full max-w-full px-1">
                  {chatError.type === 'USAGE_LIMIT_EXCEEDED' && chatError.details ? (
                    <UsageLimitError
                      modelTier={chatError.details.modelTier}
                      resetTime={chatError.details.resetTime}
                      className="w-full max-w-full sm:max-w-3xl md:max-w-3xl mx-auto"
                    />
                  ) : (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-4 w-full max-w-full sm:max-w-3xl md:max-w-3xl mx-auto shadow-md">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-semibold text-red-800">
                            Error
                          </h3>
                          <div className="mt-2 text-sm text-red-700 font-medium">
                            {chatError.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setChatError(null)}
                      className="text-xs hover:bg-red-50"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleChatSubmit} className="w-full max-w-full sm:max-w-3xl md:max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-2 flex gap-2 items-end hover:shadow-xl transition-shadow">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about your health data..."
                    rows={1}
                    className="flex-1 min-h-[44px] max-h-[120px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-sm md:text-base px-2 py-2.5"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSubmit(e as any)
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isLoading} 
                    size="icon"
                    className="rounded-full h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* Compact header with logo */}
            <div className="border-b border-slate-200 px-3 py-2 md:px-4 md:py-2.5 bg-white/80 backdrop-blur-md flex-shrink-0 shadow-sm sticky top-0 z-10">
              <div className="flex items-center justify-between gap-2 md:gap-4">
                {/* Left side: Menu + Logo + Title */}
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hover:bg-blue-50 flex-shrink-0 h-8 w-8 p-0"
                  >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </Button>
                  
                  {/* Logo + Brand */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <span className="hidden sm:inline text-sm md:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      OpenMed
                    </span>
                  </div>
                  
                  {/* Conversation title */}
                  {currentConversation?.title && (
                    <>
                      <div className="hidden md:block w-px h-5 bg-slate-300" />
                      <h1 className="text-sm md:text-base text-slate-600 truncate max-w-[120px] sm:max-w-[200px] md:max-w-md">
                        {currentConversation.title}
                      </h1>
                    </>
                  )}
                </div>
                
                {/* Right side: Dashboard + Demo + Model */}
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1.5 hover:bg-blue-50 hover:text-blue-600 transition-all h-8 px-2 md:px-3">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden lg:inline font-medium text-xs">Dashboard</span>
                    </Button>
                  </Link>
                  
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-lg border border-orange-200">
                    <TestTube className="w-3.5 h-3.5 text-orange-600" />
                    <Label htmlFor="demo-mode-messages" className="text-xs font-medium text-slate-700 hidden sm:inline">Demo</Label>
                    <Switch 
                      id="demo-mode-messages"
                      checked={demoMode} 
                      onCheckedChange={setDemoMode}
                      className="data-[state=checked]:bg-orange-500 scale-75"
                    />
                  </div>
                  
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={handleModelChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Custom API Key Banner */}
            <CustomKeyBanner />

            {/* Messages and input container - allows input to float over messages */}
            <div className="flex-1 relative min-h-0">
              {/* Scrollable messages area */}
              <div className="absolute inset-0 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-4 bg-white">
                {messages.map((message, index) => (
                  <div key={message.id} className="space-y-4 w-full max-w-full sm:max-w-3xl md:max-w-4xl mx-auto">
                    {/* Show loading animation above tool cards for the last assistant message being processed */}
                    {message.role === 'assistant' && isLoading && index === messages.length - 1 && (
                      <AIProcessingStages />
                    )}
                    
                    {/* Show tool calls first (above the text) */}
                    {message.toolInvocations?.map((toolCall) => (
                      <ToolCallVisualization key={toolCall.toolCallId} toolCall={toolCall} />
                    ))}
                    
                    {/* Then show the message content */}
                    {message.role !== 'data' && (
                      <ChatMessage message={message} />
                    )}
                  </div>
                ))}
                
                {/* Show loading animation when starting a new response (no assistant message yet) */}
                {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                  <div className="space-y-4 w-full max-w-full sm:max-w-3xl md:max-w-4xl mx-auto">
                    <AIProcessingStages />
                  </div>
                )}
                
                {/* Extra padding at bottom to prevent last message from being hidden under input */}
                <div className="h-32 sm:h-36 md:h-40" />
                
                {/* Auto-scroll target */}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating chat input area at bottom - positioned absolutely over messages */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-10">
                <div className="p-3 sm:p-4 md:p-6 pointer-events-auto">
                  {/* Error display */}
                  {chatError && (
                    <div className="mb-3 space-y-2 w-full max-w-full px-1">
                      {chatError.type === 'USAGE_LIMIT_EXCEEDED' && chatError.details ? (
                        <UsageLimitError
                          modelTier={chatError.details.modelTier}
                          resetTime={chatError.details.resetTime}
                          className="w-full max-w-full sm:max-w-3xl md:max-w-3xl mx-auto"
                        />
                      ) : (
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-4 w-full max-w-full sm:max-w-3xl md:max-w-3xl mx-auto shadow-md">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-semibold text-red-800">
                                Error
                              </h3>
                              <div className="mt-2 text-sm text-red-700 font-medium break-words">
                                {chatError.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setChatError(null)}
                          className="text-xs hover:bg-red-50"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleChatSubmit} className="w-full max-w-full sm:max-w-3xl md:max-w-4xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-2 flex gap-2 items-end hover:shadow-xl transition-shadow">
                      <Textarea
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask about your health data..."
                        rows={1}
                        className="flex-1 min-h-[44px] max-h-[120px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-sm md:text-base px-2 py-2.5"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleChatSubmit(e as any)
                          }
                        }}
                      />
                      <Button 
                        type="submit" 
                        disabled={!input.trim() || isLoading} 
                        size="icon"
                        className="rounded-full h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
