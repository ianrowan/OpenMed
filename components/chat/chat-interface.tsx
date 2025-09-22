'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatMessage } from '@/components/chat/chat-message'
import { ToolCallVisualization } from '@/components/chat/tool-call-visualization'
import { ModelSelector } from '@/components/chat/model-selector'
import { UsageLimitError } from '@/components/chat/usage-limit-error'
import { AIProcessingStages } from '@/components/ui/ai-processing'
import { BloodworkDialog } from '@/components/dialogs/bloodwork-dialog'
import { Send, Upload, Activity } from 'lucide-react'
import Link from 'next/link'
import { ModelType } from '@/lib/ai'

export default function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('gpt-4.1-mini')
  const [chatError, setChatError] = useState<{
    message: string
    type?: string
    details?: any
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel
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
  })

  // Auto-scroll to bottom when messages change or when loading
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const hasMessages = messages.length > 0

  if (!hasMessages) {
    return (
      <div className="flex h-full flex-col max-h-full">
        {/* Fixed header area with model selector */}
        <div className="border-b p-4 bg-background flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">OpenMed AI Chat</h1>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isLoading}
            />
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
              Upload your medical data and start chatting to gain insights about your health.
              I can analyze blood work, genetic data, and search medical literature.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-2xl w-full">
            <Link href="/upload">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
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
            </Link>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Example Questions</CardTitle>
                <CardDescription>
                  Try asking about biomarker trends, genetic variants, or health correlations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-6">
            <BloodworkDialog triggerText="Need Bloodwork? Get comprehensive testing" triggerSize="default" className="w-full sm:w-auto" />
          </div>
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
          
          <form 
            onSubmit={(e) => {
              setChatError(null) // Clear errors on new submission
              handleSubmit(e)
            }} 
            className="flex gap-2 max-w-2xl mx-auto"
          >
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your health data... (e.g., 'What are my out of range biomarkers?')"
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  const form = e.currentTarget.form
                  if (form) {
                    setChatError(null)
                    handleSubmit(e as any)
                  }
                }
              }}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="self-end">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col max-h-full">
      {/* Fixed header area with model selector */}
      <div className="border-b p-4 bg-background flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">OpenMed AI Chat</h1>
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
        
        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
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
              />
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
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
        
        <form 
          onSubmit={(e) => {
            setChatError(null) // Clear errors on new submission
            handleSubmit(e)
          }} 
          className="flex gap-2"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your health data..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const form = e.currentTarget.form
                if (form) {
                  setChatError(null)
                  handleSubmit(e as any)
                }
              }
            }}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} className="self-end">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
