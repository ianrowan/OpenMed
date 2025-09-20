'use client'

import { useState, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatMessage } from '@/components/chat/chat-message'
import { ToolCallVisualization } from '@/components/chat/tool-call-visualization'
import { ModelSelector } from '@/components/chat/model-selector'
import { FileUpload } from '@/components/data/file-upload'
import { AIProcessingStages } from '@/components/ui/ai-processing'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { UsageLimitError } from '@/components/chat/usage-limit-error'
import { useChatContext } from '@/components/chat/chat-context'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Send, Upload, Activity, Menu, X, TestTube } from 'lucide-react'
import { ModelType } from '@/lib/ai'
import { cn } from '@/lib/utils'
import type { Message as UIMessage } from 'ai'

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
  const [showUpload, setShowUpload] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelType>('gpt-4.1-mini')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [chatError, setChatError] = useState<{
    message: string
    type?: string
    details?: any
  } | null>(null)
  
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
  }

  const handleConversationSelect = async (conversationId: string) => {
    await loadConversation(conversationId)
  }

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Clear any existing errors when submitting new message
    setChatError(null)
    
    // If no current conversation, create one first
    if (!currentConversation) {
      const newConv = await createNewConversation()
      if (!newConv) return // Failed to create conversation
    }
    
    // Submit the message - the API will handle saving
    handleSubmit(e)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-full max-h-full">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r bg-background",
        sidebarOpen ? "w-80" : "w-0 border-r-0"
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
      <div className="flex-1 flex flex-col min-w-0">
        {!hasMessages ? (
          <div className="flex h-full flex-col">
            {/* Fixed header area with model selector and sidebar toggle */}
            <div className="border-b p-4 bg-background flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </Button>
                  <h1 className="text-lg font-semibold">OpenMed AI Chat</h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="demo-mode" className="text-sm">Demo Mode</Label>
                    <Switch 
                      id="demo-mode"
                      checked={demoMode} 
                      onCheckedChange={setDemoMode}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Welcome content area */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-4 min-h-0">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Welcome to OpenMed AI</h2>
                <p className="text-muted-foreground max-w-md">
                  {demoMode ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm font-medium mb-2">
                        <TestTube className="w-4 h-4" />
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

              <div className="grid gap-4 md:grid-cols-2 max-w-2xl w-full">
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowUpload(true)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload Data
                    </CardTitle>
                    <CardDescription>
                      Upload blood work, genetic test results, or other medical data
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Example Questions</CardTitle>
                    <CardDescription>
                      Try asking about biomarker trends, genetic variants, or health correlations
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {showUpload && (
                <div className="w-full max-w-2xl">
                  <FileUpload onUploadComplete={() => setShowUpload(false)} />
                </div>
              )}
            </div>

            {/* Fixed chat input area at bottom */}
            <div className="border-t p-4 bg-background flex-shrink-0 space-y-4">
              {/* Error display */}
              {chatError && (
                <div className="space-y-2">
                  {chatError.type === 'USAGE_LIMIT_EXCEEDED' && chatError.details ? (
                    <UsageLimitError
                      modelTier={chatError.details.modelTier}
                      resetTime={chatError.details.resetTime}
                      className="max-w-2xl mx-auto"
                    />
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 max-w-2xl mx-auto">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            Error
                          </h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
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
                      className="text-xs"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleChatSubmit} className="flex gap-2 max-w-2xl mx-auto">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about your health data... (e.g., 'What are my out of range biomarkers?')"
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleChatSubmit(e as any)
                    }
                  }}
                />
                <Button type="submit" disabled={!input.trim() || isLoading} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* Fixed header area with model selector and sidebar toggle */}
            <div className="border-b p-4 bg-background flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </Button>
                  <h1 className="text-lg font-semibold">
                    {currentConversation?.title || 'OpenMed AI Chat'}
                  </h1>
                </div>
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message, index) => (
                <div key={message.id} className="space-y-4">
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
                <div className="space-y-4">
                  <AIProcessingStages />
                </div>
              )}
            </div>

            {/* Fixed chat input area at bottom */}
            <div className="border-t p-4 bg-background flex-shrink-0 space-y-4">
              {/* Error display */}
              {chatError && (
                <div className="space-y-2">
                  {chatError.type === 'USAGE_LIMIT_EXCEEDED' && chatError.details ? (
                    <UsageLimitError
                      modelTier={chatError.details.modelTier}
                      resetTime={chatError.details.resetTime}
                      className="max-w-2xl mx-auto"
                    />
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 max-w-2xl mx-auto">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            Error
                          </h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
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
                      className="text-xs"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleChatSubmit} className="flex gap-2 max-w-2xl mx-auto">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about your health data..."
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleChatSubmit(e as any)
                    }
                  }}
                />
                <Button type="submit" disabled={!input.trim() || isLoading} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
